import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/orders.js';

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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));