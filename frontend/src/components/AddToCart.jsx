import { useState } from 'react';
import { useShop } from '../ShopContext';

const MAX_QTY = 10;

export default function AddToCart({ product }) {
  const { addToCart, toggleWishlist, inWishlist, busy } = useShop();
  const [qty, setQty] = useState(1);
  const max = Math.min(product.stock, MAX_QTY);
  const liked = inWishlist(product.id);

  return (
    <div className="mt-6 flex flex-wrap items-end gap-3">
      {max > 0 && (
        <div>
          <label htmlFor="qty" className="mb-1 block text-sm font-medium">
            Quantity
          </label>
          <select
            id="qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: max }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        disabled={busy || max === 0}
        onClick={() => addToCart(product.id, qty)}
        className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {max === 0 ? 'Out of stock' : 'Add to cart'}
      </button>

      <button
        type="button"
        disabled={busy}
        aria-pressed={liked}
        onClick={() => toggleWishlist(product.id)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
      >
        {liked ? '♥ In wishlist' : '♡ Add to wishlist'}
      </button>
    </div>
  );
}