import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { formatProduct, parseId, handleError } from '../lib/helpers.js';

const router = Router();

// One line protects EVERY route in this file
router.use(authenticate, requireAdmin);

// Accept our own uploaded images, or normal http(s) links
function isValidImage(u) {
  if (/^\/uploads\/[\w-]+\.(jpg|png|webp)$/.test(u)) return true;
  try {
    const protocol = new URL(u).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.number('Price must be a number').positive('Price must be greater than 0').max(10000000),
  discount: z.number().int().min(0, 'Discount cannot be negative').max(90, 'Discount is too high').optional(),
  stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').optional(),
  imageUrl: z
    .string('Add an image')
    .trim()
    .max(500)
    .refine(isValidImage, 'Use an uploaded image or a link starting with http:// or https://'), 
  specs: z.record(z.string(), z.string()).optional(),
  categoryId: z.number().int().positive('Choose a category'),
});

// For editing: every field becomes optional, so you can change just the price or stock
const updateSchema = productSchema.partial();

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  parentId: z.number().int().positive().nullable().optional(),
});

// specs is an object in the request, but SQLite stores it as text
function toData(data) {
  const copy = { ...data };
  if (copy.specs !== undefined) copy.specs = JSON.stringify(copy.specs);
  return copy;
}

// ================= PRODUCTS =================

// POST /api/admin/products
router.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!cat) return res.status(400).json({ message: 'Category does not exist' });

    const product = await prisma.product.create({
      data: toData(parsed.data),
      include: { category: true },
    });
    res.status(201).json(formatProduct(product));
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/admin/products/:id (edit anything, including price and stock)
router.put('/products/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid product id' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  try {
    if (parsed.data.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
      if (!cat) return res.status(400).json({ message: 'Category does not exist' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: toData(parsed.data),
      include: { category: true },
    });
    res.json(formatProduct(product));
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid product id' });

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Never delete a product that real orders refer to, or order history would break
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      return res.status(409).json({
        message: 'This product is in past orders and cannot be deleted. Set its stock to 0 instead.',
      });
    }

    // A transaction runs all steps together: either all succeed or none do
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({ message: 'Product deleted' });
  } catch (err) {
    handleError(err, res);
  }
});

// ================= CATEGORIES =================

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    if (parsed.data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent) return res.status(400).json({ message: 'Parent category does not exist' });
    }
    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/admin/categories/:id (rename)
router.put('/categories/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid category id' });

  const parsed = categorySchema.pick({ name: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    res.json(category);
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid category id' });

  try {
    const [products, children] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    if (products > 0 || children > 0) {
      return res.status(409).json({
        message: 'Category still has products or subcategories. Move or delete them first.',
      });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;