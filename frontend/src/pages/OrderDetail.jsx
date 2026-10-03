import { Link, useLocation, useParams } from 'react-router-dom';
import { useFetch } from '../useFetch';
import { ErrorBox } from '../components/States';
import { STATUS_STEPS, formatPrice, statusLabel } from '../utils';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { data: o, loading, error, retry } = useFetch(`/orders/${id}`);

  if (loading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading order…
      </p>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} onRetry={retry} />
        <Link to="/orders" className="text-indigo-600 underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const current = STATUS_STEPS.indexOf(o.status);

  return (
    <div className="space-y-6">
      {location.state?.placed && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h1 className="text-xl font-bold text-green-800">Order placed. Thank you!</h1>
          <p className="mt-1 text-sm text-green-700">Your order number is #{o.id}. We will update its status here.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Order #{o.id}</h2>
        <p className="text-sm text-gray-500">
          Placed on {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <ol aria-label="Order progress" className="flex flex-wrap gap-y-3 rounded-xl border border-gray-200 bg-white p-4">
        {STATUS_STEPS.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s} className="flex min-w-[5rem] flex-1 flex-col items-center text-center text-xs">
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 items-center justify-center rounded-full font-semibold text-white ${done ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={`mt-1 ${done ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{statusLabel(s)}</span>
              {i === current && <span className="sr-only">(current status)</span>}
            </li>
          );
        })}
      </ol>

      <section aria-label="Items" className="rounded-xl border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 p-3">
              <img src={i.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/products/${i.productId}`} className="font-medium hover:text-indigo-600">
                  {i.name}
                </Link>
                <p className="text-sm text-gray-500">
                  {formatPrice(i.price)} × {i.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gray-200 p-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(o.total)}</span>
        </div>
      </section>

      <section aria-label="Delivery address" className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-1 font-semibold">Delivery address</h3>
        <p className="whitespace-pre-line text-sm text-gray-700">{o.address}</p>
      </section>

      <Link to="/orders" className="inline-block text-indigo-600 underline">
        ← All orders
      </Link>
    </div>
  );
}