import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import { authenticate, requireAdmin } from './middleware/auth.js';

// Stop immediately if the secret is missing, instead of failing mysteriously later
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env');
  process.exit(1);
}

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// All auth routes start with /api/auth
app.use('/api/auth', authRoutes);

// TEMPORARY route, only to test admin protection (we'll remove it later)
app.get('/api/admin/ping', authenticate, requireAdmin, (req, res) => {
  res.json({ message: `Hello admin ${req.user.name}` });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));