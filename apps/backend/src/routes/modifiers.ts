import express from 'express';
import prisma from '../prisma';

const router = express.Router();

// Create modifier for a product
router.post('/:productId/modifiers', async (req, res) => {
  const { productId } = req.params;
  const { name, minSelect, maxSelect, options } = req.body; // options: [{name, priceDelta}]
  try {
    const modifier = await prisma.modifier.create({ data: { productId, name, minSelect, maxSelect, options: { create: options || [] } }, include: { options: true } });
    res.json({ modifier });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

export default router;
