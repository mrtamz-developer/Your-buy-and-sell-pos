import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get inventory for product in a store (query param storeId optional)
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { storeId } = req.query;
  const inventory = await prisma.inventory.findMany({ where: { productId, storeId: storeId ? String(storeId) : undefined } });
  res.json({ inventory });
});

// Adjust inventory quantity (delta)
router.post('/adjust', authMiddleware, async (req: AuthRequest, res) => {
  const { productId, storeId, delta } = req.body;
  if (!productId || typeof delta !== 'number') return res.status(400).json({ message: 'productId and numeric delta required' });
  try {
    // find or create inventory
    let inventory = await prisma.inventory.findFirst({ where: { productId, storeId } });
    if (!inventory) {
      inventory = await prisma.inventory.create({ data: { productId, storeId, quantity: delta } });
      return res.json({ inventory });
    }
    const updated = await prisma.inventory.update({ where: { id: inventory.id }, data: { quantity: inventory.quantity + delta } });
    res.json({ inventory: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
