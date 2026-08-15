import bcrypt from 'bcryptjs';
import prisma from '../src/prisma';

async function main() {
  console.log('Seeding database...');

  // Create a store
  const store = await prisma.store.create({
    data: {
      name: 'Main Store',
      address: '123 Demo St',
    },
  });

  // Create an admin user
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
      storeId: store.id,
    },
  });

  // Create some products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Coffee', description: 'Freshly brewed', sku: 'COF-001', price: 300, storeId: store.id } }),
    prisma.product.create({ data: { name: 'Tea', description: 'Green tea', sku: 'TEA-001', price: 250, storeId: store.id } }),
    prisma.product.create({ data: { name: 'Muffin', description: 'Blueberry muffin', sku: 'MUF-001', price: 200, storeId: store.id } }),
  ]);

  // Inventory entries
  await Promise.all(products.map(p => prisma.inventory.create({ data: { productId: p.id, quantity: 100, storeId: store.id } })));

  // Create a customer with some initial points
  const customer = await prisma.customer.create({ data: { name: 'Jane Doe', email: 'jane@example.com', phone: '+123456789', pointsBalance: 50 } });

  // Create a sample sale with points used
  const totalPrice = products[0].price + products[2].price;
  const pointsToUse = 20; // points
  const pointsValue = pointsToUse * 1; // 1 cent per point redemption rate
  const totalAfterPoints = totalPrice - pointsValue;

  const sale = await prisma.sale.create({
    data: {
      storeId: store.id,
      employeeId: admin.id,
      customerId: customer.id,
      total: totalAfterPoints,
      lineItems: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: products[0].price },
          { productId: products[2].id, quantity: 1, unitPrice: products[2].price },
        ],
      },
      payments: {
        create: [
          { amount: pointsValue, method: 'POINTS', status: 'COMPLETED' },
          { amount: totalAfterPoints - 0, method: 'CASH', status: 'COMPLETED' },
        ],
      },
    },
    include: { lineItems: true, payments: true },
  });

  // Adjust inventory for sample sale
  for (const li of sale.lineItems) {
    await prisma.inventory.updateMany({ where: { productId: li.productId, storeId: store.id }, data: { quantity: { decrement: li.quantity } } });
  }

  // Create points ledger entries: subtract used, add earned
  await prisma.pointsLedger.create({ data: { customerId: customer.id, change: -pointsToUse, reason: 'Redeemed on sample sale', balanceAfter: customer.pointsBalance - pointsToUse } });
  const pointsEarned = Math.floor(totalAfterPoints / 100); // 1 point per 100 cents
  await prisma.pointsLedger.create({ data: { customerId: customer.id, change: pointsEarned, reason: 'Points earned on sample sale', balanceAfter: customer.pointsBalance - pointsToUse + pointsEarned } });
  // Update customer's pointsBalance
  await prisma.customer.update({ where: { id: customer.id }, data: { pointsBalance: customer.pointsBalance - pointsToUse + pointsEarned } });

  console.log('Seeded: store=', store.id, 'admin=', admin.email, 'products=', products.length, 'sale=', sale.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
