import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { runAssistant } from '../lib/shopAssistant.js';

const router = Router();
router.use(authenticate); // login required, so strangers can't use up your AI quota

// Simple rate limit: 10 messages per minute per user (kept in memory)
const hits = new Map();
function limit(req, res, next) {
  const now = Date.now();
  const recent = (hits.get(req.user.id) || []).filter((t) => now - t < 60000);
  if (recent.length >= 10) {
    return res.status(429).json({ message: 'You are sending messages too fast. Wait a minute and try again.' });
  }
  recent.push(now);
  hits.set(req.user.id, recent);
  next();
}

const bodySchema = z.object({
  message: z.string('Type a message').trim().min(1, 'Type a message').max(500, 'Message is too long (500 characters max)'),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(1500) }))
    .max(6)
    .default([]),
});

// POST /api/ai/chat
router.post('/chat', limit, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

  try {
    res.json(await runAssistant(parsed.data.message, parsed.data.history));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'INFY could not answer right now. Please try again.' });
  }
});

export default router;