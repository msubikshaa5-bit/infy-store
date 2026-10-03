import { Link } from 'react-router-dom';
import { useFetch } from '../useFetch';
import { ErrorBox } from '../components/States';
import { formatPrice, statusLabel, statusStyle } from '../utils';

export default function Orders() {
  const { data, loading, error, retry } = useFetch('/orders');

  if (loading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading your orders…
      </p>
    );
  }
  if (error) return <ErrorBox message={error} onRetry={retry} />;

  return (
    <section aria-label="Order history">
      <h1 className="mb-4 text-2xl font-bold">Your orders</h1>
      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="font-medium">You have not placed any orders yet</p>
          <Link to="/products" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((o) => (
            <li key={o.id}>
              <Link
                to={`/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div>
                  <p className="font-semibold">Order #{o.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                  <span className="font-semibold">{formatPrice(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}