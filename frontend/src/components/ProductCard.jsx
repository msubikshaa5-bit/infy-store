import { Link } from 'react-router-dom';
import { formatPrice } from '../utils';
import Rating from './Rating';

export default function ProductCard({ product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {product.discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {product.discount}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded bg-gray-900 px-3 py-1 text-sm font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="truncate font-medium text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.category.name}</p>
        <Rating rating={product.rating} count={product.ratingCount} />
        <p className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.finalPrice)}</span>
          {product.discount > 0 && (
            <span className="text-sm text-gray-500 line-through">{formatPrice(product.price)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}