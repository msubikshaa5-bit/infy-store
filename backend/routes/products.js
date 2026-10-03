import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { formatProduct, parseId, handleError } from '../lib/helpers.js';

const router = Router();

// Rules for the query string. z.coerce.number() turns the text "500" into the number 500.
const listSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be 1 to 5').max(5, 'Rating must be 1 to 5'),
  comment: z.string().trim().min(1, 'Write a short comment').max(500, 'Comment is too long'),
});

// ---- GET /api/products (search, filter, sort, pagination) ----
router.get('/', async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { search, category, minPrice, maxPrice, inStock, sort, page, limit } = parsed.data;

  try {
    // Build the "where" filter piece by piece
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      // Choosing a main category also shows products from its subcategories
      const kids = await prisma.category.findMany({
        where: { parentId: category },
        select: { id: true },
      });
      where.categoryId = { in: [category, ...kids.map((k) => k.id)] };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    const orderBy = {
      newest: { createdAt: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      name: { name: 'asc' },
    }[sort];

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, reviews: { select: { rating: true } } },
      }),
    ]);

    res.json({
      products: items.map(formatProduct),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ---- GET /api/products/:id (one product with reviews) ----
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid product id' });

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({
      ...formatProduct(product),
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        userName: r.user.name,
      })),
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ---- POST /api/products/:id/reviews (logged-in customers only) ----
router.post('/:id/reviews', authenticate, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid product id' });

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // One review per user per product (duplicate-action prevention)
    const already = await prisma.review.findFirst({
      where: { productId: id, userId: req.user.id },
    });
    if (already) {
      return res.status(409).json({ message: 'You already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: { ...parsed.data, productId: id, userId: req.user.id },
    });
    res.status(201).json(review);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;