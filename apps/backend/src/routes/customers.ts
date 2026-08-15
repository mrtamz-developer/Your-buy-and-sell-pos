import express from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// List customers
router.get('/', async (_req, res) => {
  const customers = await prisma.customer.findMany();
  res.json({ customers });
});

// Get customer with points ledger
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return res.status(404).json({ message: 'not found' });
  const ledger = await prisma.pointsLedger.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' } });
  res.json({ customer, ledger });
});

// Adjust customer points (admin)
router.post('/:id/points/adjust', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { change, reason } = req.body;
  if (typeof change !== 'number') return res.status(400).json({ message: 'change must be a number' });
  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ message: 'customer not found' });
    const newBalance = customer.pointsBalance + change;
    await prisma.customer.update({ where: { id }, data: { pointsBalance: newBalance } });
    await prisma.pointsLedger.create({ data: { customerId: id, change, reason: reason || 'Manual adjustment', balanceAfter: newBalance } });
    res.json({ ok: true, balance: newBalance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
