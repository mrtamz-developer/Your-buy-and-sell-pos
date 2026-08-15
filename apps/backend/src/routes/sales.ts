import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create a sale (transactional) with points support
// body: { storeId, customerId?, lineItems: [{productId, quantity, unitPrice}], payments: [{amount, method}], pointsToUse }
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { storeId, customerId, lineItems, payments, pointsToUse } = req.body;
  const employeeId = req.user?.id;
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) return res.status(400).json({ message: 'lineItems required' });

  const earnDivisor = Number(process.env.POINTS_EARN_DIVISOR || 100);
  const redemptionRate = Number(process.env.POINTS_REDEMPTION_RATE || 1); // cents per point

  // compute total in cents
  const total = lineItems.reduce((acc: number, li: any) => acc + (li.unitPrice || 0) * (li.quantity || 0), 0);

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

    const totalAfterPoints = Math.max(0, total - pointsValue);

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
            create: lineItems.map((li: any) => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice })),
          },
          payments: {
            create: paymentsToCreate,
          },
        },
        include: { lineItems: true, payments: true },
      });

      // Handle points deduction and earning
      if (pointsValue > 0 && customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          const newBalanceAfterDeduct = customer.pointsBalance - ptsToUse;
          await tx.customer.update({ where: { id: customerId }, data: { pointsBalance: newBalanceAfterDeduct } });
          await tx.pointsLedger.create({ data: { customerId, change: -ptsToUse, reason: 'Redeemed on sale', balanceAfter: newBalanceAfterDeduct } });
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
            await tx.pointsLedger.create({ data: { customerId, change: pointsEarned, reason: 'Points earned on sale', balanceAfter: newBalance } });
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
