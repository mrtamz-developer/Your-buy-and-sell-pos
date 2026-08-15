import express from 'express';
import prisma from '../prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List products
router.get('/', async (_req, res) => {
  const products = await prisma.product.findMany();
  res.json({ products });
});

// Create product
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { name, description, sku, price, storeId } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  try {
    const product = await prisma.product.create({ data: { name, description, sku, price: price || 0, storeId } });
    res.json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Get product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ message: 'not found' });
  res.json({ product });
});

// Update product
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const product = await prisma.product.update({ where: { id }, data });
    res.json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
