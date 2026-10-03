import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { formatProduct, parseId, handleError } from '../lib/helpers.js';
import { UPLOAD_DIR } from '../lib/upload.js';

const router = Router();
router.use(authenticate, requireAdmin); // protects EVERY route in this file

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const LOW_STOCK = 5;

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};
const productListSchema = z.object({ search: z.string().trim().max(100).optional(), ...paging });
const orderListSchema = z.object({ status: z.enum(STATUS_STEPS).optional(), ...paging });

// ================= DASHBOARD =================
router.get('/stats', async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalOrders, revenue, lowStock, recent] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, stock: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
    ]);

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      revenue: revenue._sum.total ?? 0,
      lowStockLimit: LOW_STOCK,
      lowStock,
      recentOrders: recent.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        customerName: o.user.name,
      })),
    });
  } catch (err) {
    handleError(err, res);
  }
});

// ================= PRODUCT LIST (admin table) =================
router.get('/products', async (req, res) => {
  const parsed = productListSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { search, page, limit } = parsed.data;

  try {
    const where = search ? { name: { contains: search } } : {};
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
    ]);
    res.json({ products: items.map(formatProduct), page, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    handleError(err, res);
  }
});

// ================= ORDERS =================
router.get('/orders', async (req, res) => {
  const parsed = orderListSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { status, page, limit } = parsed.data;

  try {
    const where = status ? { status } : {};
    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true } },
        },
      }),
    ]);
    res.json({
      orders: rows.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        customerName: o.user.name,
        customerEmail: o.user.email,
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      })),
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.get('/orders/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid order id' });

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
      },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      address: order.address,
      createdAt: order.createdAt,
      customerName: order.user.name,
      customerEmail: order.user.email,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        quantity: i.quantity,
        price: i.price,
      })),
    });
  } catch (err) {
    handleError(err, res);
  }
});

// Move an order to its NEXT status only
router.patch('/orders/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid order id' });

  const parsed = z.object({ status: z.enum(STATUS_STEPS, 'Invalid status') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const from = STATUS_STEPS.indexOf(order.status);
    const to = STATUS_STEPS.indexOf(parsed.data.status);

    if (from === STATUS_STEPS.length - 1) {
      return res.status(409).json({ message: 'This order is already delivered' });
    }
    if (to !== from + 1) {
      return res.status(409).json({ message: `This order can only move to ${STATUS_STEPS[from + 1]}` });
    }

    // "status: order.status" makes this safe if another admin changed it a moment ago
    const result = await prisma.order.updateMany({
      where: { id, status: order.status },
      data: { status: parsed.data.status },
    });
    if (result.count === 0) {
      return res.status(409).json({ message: 'The order was just changed by someone else. Refresh and try again.' });
    }
    res.json({ id, status: parsed.data.status });
  } catch (err) {
    handleError(err, res);
  }
});

// ================= USERS =================
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } }, // the password is never selected
      },
    });
    res.json(
      users.map(({ _count, ...u }) => ({ ...u, orderCount: _count.orders }))
    );
  } catch (err) {
    handleError(err, res);
  }
});

router.patch('/users/:id/role', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid user id' });

  const parsed = z.object({ role: z.enum(['CUSTOMER', 'ADMIN'], 'Invalid role') }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

  // An admin can't remove their own admin rights, so the shop is never left without an admin
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, role: true },
    });
    res.json(user);
  } catch (err) {
    handleError(err, res);
  }
});

// ================= IMAGE UPLOAD =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

// Look at the real first bytes of the file. The file name and type come from the
// browser, so they can be faked. The bytes cannot.
function detectType(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function receiveFile(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : 'Upload failed';
      return res.status(400).json({ message });
    }
    next();
  });
}

router.post('/upload', receiveFile, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload' });

  const ext = detectType(req.file.buffer);
  if (!ext) return res.status(400).json({ message: 'Only JPG, PNG or WebP images are allowed' });

  try {
    const name = `${crypto.randomUUID()}.${ext}`; // random name: the original name is never used
    await fs.writeFile(path.join(UPLOAD_DIR, name), req.file.buffer);
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;