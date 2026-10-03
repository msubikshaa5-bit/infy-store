import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { parseId, handleError, finalPriceOf } from '../lib/helpers.js';

const router = Router();
router.use(authenticate);

const addressSchema = z.object({
  fullName: z.string('Enter your full name').trim().min(2, 'Enter your full name').max(60, 'Name is too long'),
  phone: z.string('Enter your phone number').trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string('Enter your street address').trim().min(5, 'Enter your full street address').max(120, 'Address is too long'),
  city: z.string('Enter your city').trim().min(2, 'Enter your city').max(50, 'City name is too long'),
  state: z.string('Enter your state').trim().min(2, 'Enter your state').max(50, 'State name is too long'),
  pincode: z.string('Enter your pincode').trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

const checkoutSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(['CARD', 'UPI', 'COD'], 'Choose a payment method'),
  simulateFailure: z.boolean().optional(), // lets you demo a failed payment
});

// An error we throw on purpose inside the transaction, with the right HTTP status
class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Pretend to talk to a payment provider. No real money, no card data.
async function simulatePayment(fail) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (fail) throw new CheckoutError(402, 'Payment failed (simulated). You have not been charged and your cart is unchanged.');
}

// ---- POST /api/orders  (checkout) ----
router.post('/', async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { address, simulateFailure } = parsed.data;
  const userId = req.user.id;
  const addressText = `${address.fullName}, ${address.phone}\n${address.line1}, ${address.city}, ${address.state} - ${address.pincode}`;

  try {
    // Everything inside runs as ONE unit: all steps succeed, or all are undone
    const order = await prisma.$transaction(
      async (tx) => {
        // 1. Read the cart from the database (never trust the browser for this)
        const cart = await tx.cartItem.findMany({
          where: { userId },
          include: { product: true },
        });
        if (cart.length === 0) throw new CheckoutError(400, 'Your cart is empty');

        // 2. Check stock, then reduce it. The "stock >= quantity" condition inside
        //    updateMany means two buyers can never take the last item together.
        for (const item of cart) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            const left = item.product.stock;
            throw new CheckoutError(
              409,
              left === 0
                ? `${item.product.name} is out of stock. Please remove it from your cart.`
                : `${item.product.name}: only ${left} left. Please reduce the quantity.`
            );
          }
        }

        // 3. Create the order. Prices are saved as they are right now.
        const lines = cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: finalPriceOf(item.product),
        }));
        const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

        const created = await tx.order.create({
          data: { userId, total, address: addressText, items: { create: lines } },
        });

        // 4. Empty the cart. A second click now finds an empty cart (duplicate prevention).
        await tx.cartItem.deleteMany({ where: { userId } });

        // 5. Simulated payment. If it fails, steps 2 to 4 are rolled back automatically.
        await simulatePayment(simulateFailure);

        return created;
      },
      { timeout: 10000 }
    );

    res.status(201).json({ id: order.id, total: order.total, status: order.status });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ message: err.message });
    }
    handleError(err, res);
  }
});

// ---- GET /api/orders  (my order history) ----
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: { select: { quantity: true } } },
    });
    res.json(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      }))
    );
  } catch (err) {
    handleError(err, res);
  }
});

// ---- GET /api/orders/:id  (one of my orders) ----
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid order id' });

  try {
    // The userId in "where" means you can only open YOUR orders.
    // Someone else's order looks exactly like a missing one (404).
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: {
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

export default router;