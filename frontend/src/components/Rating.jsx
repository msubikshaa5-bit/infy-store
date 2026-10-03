export default function Rating({ rating, count }) {
  if (!count) {
    return <span className="text-sm text-gray-400">No reviews yet</span>;
  }
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5 from ${count} reviews`}
      className="text-sm text-amber-600"
    >
      ★ {rating} <span className="text-gray-500">({count})</span>
    </span>
  );
}