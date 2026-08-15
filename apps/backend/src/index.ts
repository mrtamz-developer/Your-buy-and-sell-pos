import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import productsRouter from './routes/products';
import inventoryRouter from './routes/inventory';
import salesRouter from './routes/sales';

dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const app = express();
app.use(cors());
app.use(express.json());

function sign(user: { id: string; email: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, storeId } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'email exists' });
    const hash = await import('bcryptjs').then(m => m.hash(password, 10));
    const user = await prisma.user.create({ data: { email, passwordHash: hash, name, role, storeId } });
    const token = sign({ id: user.id, email: user.email });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });
  try {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return res.status(401).json({ message: 'invalid credentials' });
    const ok = await import('bcryptjs').then(m => m.compare(password, u.passwordHash));
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });
    const token = sign({ id: u.id, email: u.email });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'missing token' });
  const [, token] = auth.split(' ');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ message: 'user not found' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(401).json({ message: 'invalid token' });
  }
});

// Mount POS routes
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);

app.get('/', (_req, res) => res.json({ ok: true, message: 'Backend scaffold running with Prisma and POS API' }));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

export default app;
