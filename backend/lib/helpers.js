// Turn a database product into what the frontend needs
export function formatProduct(p) {
  // specs is stored as JSON text in SQLite, so convert it back to an object
  let specs = {};
  try {
    specs = JSON.parse(p.specs);
  } catch {
    specs = {};
  }

  const { reviews, ...rest } = p;
  const ratingCount = reviews ? reviews.length : 0;
  const rating = ratingCount
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
    : 0;

  // Price after discount, e.g. 27999 with 10% off becomes 25199
  const finalPrice = Math.round((p.price * (100 - p.discount)) / 100);

  return { ...rest, specs, finalPrice, rating, ratingCount };
}

// Make sure an id from the URL is a positive whole number, otherwise return null
export function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// One place to turn database errors into friendly messages
export function handleError(err, res) {
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'That value already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Not found' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
}