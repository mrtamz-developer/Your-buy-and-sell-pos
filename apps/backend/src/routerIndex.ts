import express from 'express';
import productsRouter from './routes/products';
import inventoryRouter from './routes/inventory';
import salesRouter from './routes/sales';
import purchasesRouter from './routes/purchases';
import customersRouter from './routes/customers';
import paymentsRouter from './routes/payments';
import refundsRouter from './routes/refunds';
import receiptsRouter from './routes/receipts';
import modifiersRouter from './routes/modifiers';

import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

import expressApp from 'express';
const app = expressApp();
app.use(cors());
app.use(express.json());

// Auth routes remain in index or separate — keep auth endpoints
import './index';

app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/refunds', refundsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/modifiers', modifiersRouter);

export default app;
