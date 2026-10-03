import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function phone(name, description, price, discount, stock, ram, storage, camera, battery) {
  return {
    name,
    description,
    price,
    discount,
    stock,
    imageUrl: `https://placehold.co/400x400?text=${name.replace(/ /g, '+')}`,
    specs: JSON.stringify({ RAM: ram, Storage: storage, Camera: camera, Battery: battery }),
  };
}

async function main() {
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

  const phones = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: { name: 'Smartphones' },
  });
  const everyday = await prisma.category.upsert({
    where: { name: 'Everyday Phones' },
    update: {},
    create: { name: 'Everyday Phones', parentId: phones.id },
  });
  const flagship = await prisma.category.upsert({
    where: { name: 'Flagship Phones' },
    update: {},
    create: { name: 'Flagship Phones', parentId: phones.id },
  });

  const everydayPhones = [
    phone('Spark Lite', 'Simple, reliable phone for daily use.', 12999, 0, 40, '6GB', '128GB', '50MP', '5000mAh'),
    phone('Zen M3', 'Smooth display and fast charging.', 18999, 15, 0, '8GB', '128GB', '50MP', '5000mAh'),
    phone('Orbit 5G', '5G speed at a friendly price.', 22999, 5, 30, '8GB', '256GB', '64MP', '5200mAh'),
    phone('Nova X1', 'Great camera phone with all-day battery.', 27999, 10, 25, '8GB', '128GB', '64MP', '5000mAh'),
  ];
  const flagshipPhones = [
    phone('Pulse Pro', 'Flagship performance for gamers.', 54999, 5, 8, '12GB', '256GB', '108MP', '5500mAh'),
    phone('Lumen Max', 'Bright display and pro-level video.', 64999, 8, 15, '12GB', '256GB', '108MP', '5000mAh'),
    phone('Titan Ultra', 'Our best phone with a 200MP camera.', 89999, 0, 5, '16GB', '512GB', '200MP', '5500mAh'),
  ];

  for (const p of everydayPhones) {
    await prisma.product.create({ data: { ...p, categoryId: everyday.id } });
  }
  for (const p of flagshipPhones) {
    await prisma.product.create({ data: { ...p, categoryId: flagship.id } });
  }

  console.log('Seed complete');
}

main().finally(() => prisma.$disconnect());