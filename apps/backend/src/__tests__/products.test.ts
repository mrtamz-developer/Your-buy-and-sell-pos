import request from 'supertest';
import app from '../index';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

jest.mock('../prisma');

const mockedPrisma = prisma as unknown as jest.Mocked<typeof prisma>;

describe('Products API', () => {
  const user = { id: 'user-1', email: 'u@example.com', name: 'User' };
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret');

  beforeEach(() => {
    mockedPrisma.user.findUnique = jest.fn().mockResolvedValue(user as any);
    mockedPrisma.product.create = jest.fn().mockImplementation(async ({ data }: any) => ({ id: 'p1', ...data } as any));
    mockedPrisma.product.findMany = jest.fn().mockResolvedValue([{ id: 'p1', name: 'Coffee' }] as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Latte', price: 350 });

    expect(res.status).toBe(200);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.name).toBe('Latte');
  });

  it('lists products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});
