// Allows `max` requests per `windowMs` for each visitor address (kept in memory)
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) hits.clear(); // keeps memory from growing forever

    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ message });
    }
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
}