import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { parseId, handleError, finalPriceOf } from '../lib/helpers.js';

const router = Router();
router.use(authenticate); // every cart route needs a logged-in user

const MAX_QTY = 10;

// Builds the cart the frontend shows. Prices come from the database.
async function getCart(userId) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { id: 'asc' },
  });
  const items = rows.map((r) => {
    const finalPrice = finalPriceOf(r.product);
    return {
      id: r.id,
      productId: r.productId,
      name: r.product.name,
      imageUrl: r.product.imageUrl,
      stock: r.product.stock,
      finalPrice,
      quantity: r.quantity,
      lineTotal: finalPrice * r.quantity,
    };
  });
  return {
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

const addSchema = z.object({
  productId: z.number('Invalid product').int().positive('Invalid product'),
  quantity: z
    .number('Quantity must be a number')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(MAX_QTY, `You can buy at most ${MAX_QTY} of one product`)
    .default(1),
});

const qtySchema = z.object({
  quantity: z
    .number('Quantity must be a number')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(MAX_QTY, `You can buy at most ${MAX_QTY} of one product`),
});

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    res.json(await getCart(req.user.id));
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/cart  { productId, quantity }
router.post('/', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { productId, quantity } = parsed.data;
  const userId = req.user.id;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock === 0) return res.status(409).json({ message: 'This product is out of stock' });

    const key = { userId_productId: { userId, productId } };
    const existing = await prisma.cartItem.findUnique({ where: key });
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > MAX_QTY) {
      return res.status(409).json({ message: `You can buy at most ${MAX_QTY} of one product` });
    }
    if (newQty > product.stock) {
      return res.status(409).json({ message: `Only ${product.stock} in stock` });
    }

    await prisma.cartItem.upsert({
      where: key,
      update: { quantity: newQty },
      create: { userId, productId, quantity: newQty },
    });
    res.status(201).json(await getCart(userId));
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/cart/:productId  { quantity }
router.put('/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product id' });

  const parsed = qtySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const userId = req.user.id;

  try {
    const key = { userId_productId: { userId, productId } };
    const item = await prisma.cartItem.findUnique({ where: key, include: { product: true } });
    if (!item) return res.status(404).json({ message: 'Item is not in your cart' });

    if (parsed.data.quantity > item.product.stock) {
      return res.status(409).json({ message: `Only ${item.product.stock} in stock` });
    }

    await prisma.cartItem.update({ where: key, data: { quantity: parsed.data.quantity } });
    res.json(await getCart(userId));
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  if (!productId) return res.status(400).json({ message: 'Invalid product id' });

  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id, productId } });
    res.json(await getCart(req.user.id));
  } catch (err) {
    handleError(err, res);
  }
});

export default router;