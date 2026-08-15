import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create a sale (transactional) with support for discounts and modifiers
// body: { storeId, customerId?, lineItems: [{productId, quantity, unitPrice, modifiers? }], payments: [{amount, method}], pointsToUse, discounts: [{name,type,value}] }
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { storeId, customerId, lineItems, payments, pointsToUse, discounts } = req.body;
  const employeeId = req.user?.id;
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) return res.status(400).json({ message: 'lineItems required' });

  const earnDivisor = Number(process.env.POINTS_EARN_DIVISOR || 100);
  const redemptionRate = Number(process.env.POINTS_REDEMPTION_RATE || 1); // cents per point

  // compute subtotal and apply line-level modifiers/discounts
  let subtotal = 0;
  for (const li of lineItems) {
    const base = (li.unitPrice || 0) * (li.quantity || 0);
    let delta = 0;
    // modifiers: array of { optionId, priceDelta }
    if (Array.isArray(li.modifiers)) {
      for (const m of li.modifiers) {
        delta += Number(m.priceDelta || 0) * (li.quantity || 1);
      }
    }
    let lineTotal = base + delta;
    // line-level discount
    if (li.discount) {
      const d = li.discount;
      if (d.type === 'PERCENT') {
        lineTotal = Math.round(lineTotal * (10000 - d.value) / 10000);
      } else {
        lineTotal = Math.max(0, lineTotal - (d.value || 0));
      }
    }
    subtotal += lineTotal;
  }

  // cart-level discounts
  let cartDiscountValue = 0;
  if (Array.isArray(discounts)) {
    for (const d of discounts) {
      if (d.type === 'PERCENT') {
        cartDiscountValue += Math.round(subtotal * (d.value || 0) / 10000);
      } else {
        cartDiscountValue += Number(d.value || 0);
      }
    }
  }

  const totalBeforePoints = Math.max(0, subtotal - cartDiscountValue);

  try {
    // If pointsToUse provided, validate customer has enough
    let pointsValue = 0;
    let ptsToUse = 0;
    if (pointsToUse) {
      if (!customerId) return res.status(400).json({ message: 'customerId required to use points' });
      ptsToUse = Number(pointsToUse);
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) return res.status(404).json({ message: 'customer not found' });
      if (customer.pointsBalance < ptsToUse) return res.status(400).json({ message: 'insufficient points' });
      pointsValue = ptsToUse * redemptionRate;
    }

    const totalAfterPoints = Math.max(0, totalBeforePoints - pointsValue);

    const result = await prisma.$transaction(async (tx) => {
      // Check inventory availability and decrement
      for (const li of lineItems) {
        const inv = await tx.inventory.findFirst({ where: { productId: li.productId, storeId } });
        if (!inv || inv.quantity < li.quantity) {
          throw new Error(`insufficient inventory for product ${li.productId}`);
        }
        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity - li.quantity } });
      }

      // Prepare payments array
      const paymentsToCreate: any[] = [];
      if (pointsValue > 0) {
        paymentsToCreate.push({ amount: pointsValue, method: 'POINTS', status: 'COMPLETED' });
      }
      if (Array.isArray(payments)) {
        for (const p of payments) {
          // If ONLINE_WALLET, default status PENDING unless provided
          const status = p.method === 'ONLINE_WALLET' ? (p.status || 'PENDING') : (p.status || 'COMPLETED');
          paymentsToCreate.push({ amount: p.amount, method: p.method, status, externalReference: p.externalReference });
        }
      }

      // Create sale
      const sale = await tx.sale.create({
        data: {
          storeId,
          employeeId,
          customerId,
          total: totalAfterPoints,
          lineItems: {
            create: lineItems.map((li: any) => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice, modifiers: li.modifiers ? JSON.stringify(li.modifiers) : undefined })),
          },
          payments: {
            create: paymentsToCreate,
          },
          discounts: {
            create: Array.isArray(discounts) ? discounts.map((d:any)=>({ name: d.name, type: d.type, value: d.value })) : [],
          }
        },
        include: { lineItems: true, payments: true, discounts: true },
      });

      // Handle points deduction and earning
      if (pointsValue > 0 && customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          const newBalanceAfterDeduct = customer.pointsBalance - ptsToUse;
          await tx.customer.update({ where: { id: customerId }, data: { pointsBalance: newBalanceAfterDeduct } });
          await tx.pointsLedger.create({ data: { customerId, change: -ptsToUse, reason: 'Redeemed on sale', balanceAfter: newBalanceAfterDeduct, meta: { saleId: sale.id } } });
        }
      }

      // Earn points based on totalAfterPoints
      if (customerId) {
        const pointsEarned = Math.floor(totalAfterPoints / earnDivisor);
        if (pointsEarned > 0) {
          const customer = await tx.customer.findUnique({ where: { id: customerId } });
          if (customer) {
            const newBalance = customer.pointsBalance + pointsEarned;
            await tx.customer.update({ where: { id: customerId }, data: { pointsBalance: newBalance } });
            await tx.pointsLedger.create({ data: { customerId, change: pointsEarned, reason: 'Points earned on sale', balanceAfter: newBalance, meta: { saleId: sale.id } } });
          }
        }
      }

      return sale;
    });

    res.json({ sale: result });
  } catch (e: any) {
    console.error('sale error', e);
    if (e.message && e.message.startsWith('insufficient inventory')) return res.status(400).json({ message: e.message });
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
