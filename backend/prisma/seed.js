import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin account
  await prisma.user.upsert({
    where: { email: 'admin@infy.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@infy.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'ADMIN',
    },
  });

  // Categories
  const phones = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: { name: 'Smartphones' },
  });

  // Products
  const products = [
    {
      name: 'Nova X1',
      description: 'Great camera phone with all-day battery.',
      price: 27999, discount: 10, stock: 25,
      imageUrl: 'https://placehold.co/400x400?text=Nova+X1',
      specs: JSON.stringify({ RAM: '8GB', Storage: '128GB', Camera: '64MP', Battery: '5000mAh' }),
    },
    {
      name: 'Pulse Pro',
      description: 'Flagship performance for gamers.',
      price: 54999, discount: 5, stock: 8,
      imageUrl: 'https://placehold.co/400x400?text=Pulse+Pro',
      specs: JSON.stringify({ RAM: '12GB', Storage: '256GB', Camera: '108MP', Battery: '5500mAh' }),
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: { ...p, categoryId: phones.id } });
  }
  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());