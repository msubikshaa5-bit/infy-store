import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { handleError } from '../lib/helpers.js';

const router = Router();

// ---- GET /api/categories (main categories, each with its subcategories) ----
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;