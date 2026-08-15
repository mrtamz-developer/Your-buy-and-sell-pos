import express from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Refund a sale
// body: { reason }
router.post('/:id/refund', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const sale = await prisma.sale.findUnique({ where: { id }, include: { lineItems: true, payments: true } });
    if (!sale) return res.status(404).json({ message: 'sale not found' });

    const result = await prisma.$transaction(async (tx) => {
      // Increase inventory back
      for (const li of sale.lineItems) {
        const inv = await tx.inventory.findFirst({ where: { productId: li.productId, storeId: sale.storeId } });
        if (!inv) {
          await tx.inventory.create({ data: { productId: li.productId, storeId: sale.storeId, quantity: li.quantity } });
        } else {
          await tx.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity + li.quantity } });
        }
      }

      // Create refund record
      const refund = await tx.refund.create({ data: { saleId: sale.id, amount: sale.total, reason } });

      // Reverse points: refund redeemed points and remove earned points
      if (sale.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
        if (customer) {
          // Points redeemed: sum payments with method POINTS
          const pointsPayments = sale.payments.filter(p => p.method === 'POINTS');
          let refundedPoints = 0;
          for (const pp of pointsPayments) {
            const redemptionRate = Number(process.env.POINTS_REDEMPTION_RATE || 1);
            refundedPoints += Math.round(pp.amount / redemptionRate);
            // create ledger entry to add back points
          }
          if (refundedPoints > 0) {
            const newBalance = customer.pointsBalance + refundedPoints;
            await tx.customer.update({ where: { id: customer.id }, data: { pointsBalance: newBalance } });
            await tx.pointsLedger.create({ data: { customerId: customer.id, change: refundedPoints, reason: 'Refund - points returned', balanceAfter: newBalance, meta: { saleId: sale.id } } });
          }

          // Points earned on this sale: calculate and remove
          const earnDivisor = Number(process.env.POINTS_EARN_DIVISOR || 100);
          const pointsEarned = Math.floor(sale.total / earnDivisor);
          if (pointsEarned > 0) {
            const newBalanceAfter = (await tx.customer.findUnique({ where: { id: customer.id } })).pointsBalance - pointsEarned;
            await tx.customer.update({ where: { id: customer.id }, data: { pointsBalance: newBalanceAfter } });
            await tx.pointsLedger.create({ data: { customerId: customer.id, change: -pointsEarned, reason: 'Refund - points revoked', balanceAfter: newBalanceAfter, meta: { saleId: sale.id } } });
          }
        }
      }

      return { refund, saleId: sale.id };
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
