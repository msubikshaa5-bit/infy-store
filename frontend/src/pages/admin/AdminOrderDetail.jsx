import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';
import { STATUS_STEPS, formatPrice, statusLabel } from '../../utils';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data: o, loading, error, retry } = useFetch(`/admin/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) {
    return (
      <p role="status" className="py-16 text-center text-gray-500">
        Loading order…
      </p>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} onRetry={retry} />
        <Link to="/admin/orders" className="text-indigo-600 underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const current = STATUS_STEPS.indexOf(o.status);
  const next = STATUS_STEPS[current + 1]; // undefined once delivered

  async function advance() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await api(`/admin/orders/${o.id}/status`, { method: 'PATCH', body: { status: next } });
      retry();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/orders" className="text-sm text-indigo-600 underline">
        ← Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Order #{o.id}</h1>
        <p className="text-sm text-gray-500">
          {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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
              <span className={`mt-1 ${done ? 'font-semibold' : 'text-gray-500'}`}>{statusLabel(s)}</span>
              {i === current && <span className="sr-only">(current status)</span>}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        {next ? (
          <button
            type="button"
            onClick={advance}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Updating…' : `Mark as ${statusLabel(next)}`}
          </button>
        ) : (
          <p className="font-medium text-green-700">This order has been delivered.</p>
        )}
        {message && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {message}
          </p>
        )}
      </div>

      <section aria-label="Customer" className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <h2 className="mb-1 font-semibold">Customer</h2>
        <p>{o.customerName}</p>
        <p className="text-gray-500">{o.customerEmail}</p>
        <h2 className="mb-1 mt-3 font-semibold">Delivery address</h2>
        <p className="whitespace-pre-line text-gray-700">{o.address}</p>
      </section>

      <section aria-label="Items" className="rounded-xl border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 p-3">
              <img src={i.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.name}</p>
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
    </div>
  );
}