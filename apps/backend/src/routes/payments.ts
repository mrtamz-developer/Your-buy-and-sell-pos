import express from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Confirm a payment (manual flow for ONLINE_WALLET)
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: 'payment not found' });
    await prisma.payment.update({ where: { id }, data: { status: 'COMPLETED' } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
