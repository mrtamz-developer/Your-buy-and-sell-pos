import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create a purchase (store buys inventory from supplier) -> increments inventory
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { storeId, supplier, lineItems } = req.body;
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) return res.status(400).json({ message: 'lineItems required' });
  const total = lineItems.reduce((acc: number, li: any) => acc + (li.unitPrice || 0) * (li.quantity || 0), 0);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          storeId,
          supplier,
          total,
          lineItems: { create: lineItems.map((li: any) => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice })) },
        },
        include: { lineItems: true },
      });

      // increment inventory for each line
      for (const li of lineItems) {
        const inv = await tx.inventory.findFirst({ where: { productId: li.productId, storeId } });
        if (!inv) {
          await tx.inventory.create({ data: { productId: li.productId, storeId, quantity: li.quantity } });
        } else {
          await tx.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity + li.quantity } });
        }
      }

      return purchase;
    });

    res.json({ purchase: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
