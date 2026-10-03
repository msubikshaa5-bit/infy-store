

import { rateLimit } from '../middleware/rateLimit.js';

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Slows down password guessing: 30 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

// ---- Validation rules (zod checks incoming data) ----
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Helpers ----
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Never send the password hash back to the browser
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// ---- POST /api/auth/register ----
  router.post('/register', authLimiter, async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }
  const { name, email, password } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // role is NOT taken from the request, so nobody can register themselves as admin
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// ---- POST /api/auth/login ----
  router.post('/login', authLimiter, async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }
  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && (await bcrypt.compare(password, user.password));

    // Same message for "no such email" and "wrong password", so attackers can't tell which emails exist
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// ---- GET /api/auth/me (who am I?) ----
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;

