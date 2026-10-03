import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { formatProduct, parseId, handleError } from '../lib/helpers.js';

const router = Router();
router.use(authenticate);

// GET /api/wishlist  (returns full products so the frontend can show cards)
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'desc' },
      include: {
        product: { include: { category: true, reviews: { select: { rating: true } } } },
      },
    });
    res.json(rows.map((r) => formatProduct(r.product)));
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/wishlist/:productId
router.post('/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product id' });

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // upsert: adding the same product twice does nothing instead of failing
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
    });
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product id' });

  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user.id, productId } });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;