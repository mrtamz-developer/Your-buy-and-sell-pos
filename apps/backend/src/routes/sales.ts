import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create a sale (transactional): body { storeId, customerId?, lineItems: [{productId, quantity, unitPrice}], payments: [{amount, method}] }
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { storeId, customerId, lineItems, payments } = req.body;
  const employeeId = req.user?.id;
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) return res.status(400).json({ message: 'lineItems required' });

  // compute total
  const total = lineItems.reduce((acc: number, li: any) => acc + (li.unitPrice || 0) * (li.quantity || 0), 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check inventory availability and decrement
      for (const li of lineItems) {
        const inv = await tx.inventory.findFirst({ where: { productId: li.productId, storeId } });
        if (!inv || inv.quantity < li.quantity) {
          throw new Error(`insufficient inventory for product ${li.productId}`);
        }
        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity - li.quantity } });
      }

      // Create sale with line items and payments
      const sale = await tx.sale.create({
        data: {
          storeId,
          employeeId,
          customerId,
          total,
          lineItems: {
            create: lineItems.map((li: any) => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice })),
          },
          payments: {
            create: payments.map((p: any) => ({ amount: p.amount, method: p.method })),
          },
        },
        include: { lineItems: true, payments: true },
      });

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
