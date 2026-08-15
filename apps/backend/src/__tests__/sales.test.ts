import request from 'supertest';
import app from '../index';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

jest.mock('../prisma');
const mockedPrisma = prisma as unknown as jest.Mocked<typeof prisma>;

describe('Sales API', () => {
  const user = { id: 'user-1', email: 'u@example.com', name: 'User' };
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret');

  beforeEach(() => {
    mockedPrisma.user.findUnique = jest.fn().mockResolvedValue(user as any);

    // Mock transaction to execute callback with mocked tx object
    mockedPrisma.$transaction = jest.fn().mockImplementation(async (cb: any) => {
      // create minimal tx with needed methods
      const tx = {
        inventory: {
          findFirst: jest.fn().mockResolvedValue({ id: 'inv1', quantity: 10 }),
          update: jest.fn().mockResolvedValue({ id: 'inv1', quantity: 9 }),
        },
        sale: {
          create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 'sale1', ...data })),
        },
      };
      return cb(tx);
    }) as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a sale and decrements inventory', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ storeId: 'store-1', lineItems: [{ productId: 'p1', quantity: 1, unitPrice: 300 }], payments: [{ amount: 300, method: 'CARD' }] });

    expect(res.status).toBe(200);
    expect(res.body.sale).toBeDefined();
    expect(res.body.sale.id).toBe('sale1');
  });
});
