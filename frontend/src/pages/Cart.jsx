import { Link } from 'react-router-dom';
import { useShop } from '../ShopContext';
import { formatPrice } from '../utils';

const MAX_QTY = 10;
const qtyBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function Cart() {
  const { cart, cartLoading, updateQty, removeItem, busy } = useShop();

  if (cartLoading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading your cart…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-gray-500">Find a phone you like and add it here.</p>
        <Link to="/products" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    );
  }

  const hasProblem = cart.items.some((i) => i.stock === 0 || i.quantity > i.stock);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
      <section aria-label="Cart items">
        <h1 className="mb-4 text-2xl font-bold">Your cart ({cart.itemCount})</h1>
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-3">
              <img src={i.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/products/${i.productId}`} className="font-medium hover:text-indigo-600">
                  {i.name}
                </Link>
                <p className="text-sm text-gray-500">{formatPrice(i.finalPrice)} each</p>

                {(i.stock === 0 || i.quantity > i.stock) && (
                  <p role="alert" className="mt-1 text-sm font-medium text-red-600">
                    {i.stock === 0 ? 'Out of stock. Remove it to continue.' : `Only ${i.stock} left. Reduce the quantity.`}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={qtyBtn}
                      aria-label={`Decrease quantity of ${i.name}`}
                      disabled={busy || i.quantity <= 1}
                      onClick={() => updateQty(i.productId, i.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                      {i.quantity}
                    </span>
                    <button
                      type="button"
                      className={qtyBtn}
                      aria-label={`Increase quantity of ${i.name}`}
                      disabled={busy || i.quantity >= Math.min(i.stock, MAX_QTY)}
                      onClick={() => updateQty(i.productId, i.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeItem(i.productId)}
                    className="text-sm text-red-600 underline focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Order total" className="mt-6 h-fit space-y-3 rounded-xl border border-gray-200 bg-white p-4 lg:mt-12">
        <h2 className="text-lg font-semibold">Summary</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal ({cart.itemCount} items)</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span className="text-green-600">Free</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        {hasProblem ? (
          <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2.5 font-semibold text-gray-600">
            Fix stock issues to continue
          </button>
        ) : (
          <Link
            to="/checkout"
            className="block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Proceed to checkout
          </Link>
        )}
      </aside>
    </div>
  );
}