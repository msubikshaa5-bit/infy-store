import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

// Runs before protected routes: figures out who is making the request
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user fresh from the database so the role is always current
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user; // later code can read req.user
    next();           // continue to the next step
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Runs after authenticate: only lets admins through
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}