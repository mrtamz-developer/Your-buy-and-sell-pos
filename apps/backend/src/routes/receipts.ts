import express from 'express';
import prisma from '../prisma';

const router = express.Router();

// Simple HTML receipt generator for a sale
router.get('/:id/receipt', async (req, res) => {
  const { id } = req.params;
  const sale = await prisma.sale.findUnique({ where: { id }, include: { lineItems: { include: { product: true } }, payments: true, discounts: true, customer: true, store: true, employee: true } });
  if (!sale) return res.status(404).send('Sale not found');

  // Build a simple HTML receipt
  const lines = sale.lineItems.map(li => {
    const name = li.product ? li.product.name : li.productId;
    const price = (li.unitPrice/100).toFixed(2);
    const qty = li.quantity;
    const total = ((li.unitPrice*li.quantity)/100).toFixed(2);
    return `<tr><td>${name}</td><td>${qty}</td><td>${price}</td><td>${total}</td></tr>`;
  }).join('');

  const paymentsHtml = sale.payments.map(p => `<div>${p.method} — ${(p.amount/100).toFixed(2)} — ${p.status}</div>`).join('');

  const html = `
    <html>
      <head><meta charset="utf-8"><title>Receipt ${sale.id}</title></head>
      <body style="font-family: Arial, sans-serif; max-width:400px;">
        <h2>${sale.store?.name || 'Store'}</h2>
        <div>Sale ID: ${sale.id}</div>
        <div>Date: ${new Date(sale.createdAt).toLocaleString()}</div>
        <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
          <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
        <div style="margin-top:10px; font-weight:bold">Total: ${(sale.total/100).toFixed(2)}</div>
        <div style="margin-top:8px">Payments:</div>
        <div>${paymentsHtml}</div>
        <div style="margin-top:12px; font-size:12px; color:#666">Thank you for your business.</div>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
