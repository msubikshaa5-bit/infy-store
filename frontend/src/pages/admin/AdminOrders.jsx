import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';
import { STATUS_STEPS, formatPrice, statusLabel, statusStyle } from '../../utils';

const btn =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = useFetch(`/admin/orders?page=${page}&status=${status}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-gray-600">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {STATUS_STEPS.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p role="status" className="py-12 text-center text-gray-500">
          Loading orders…
        </p>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : data.orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">Order</th>
                  <th scope="col" className="px-3 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-3 py-3 font-medium">Date</th>
                  <th scope="col" className="px-3 py-3 font-medium">Items</th>
                  <th scope="col" className="px-3 py-3 font-medium">Total</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-3 py-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">#{o.id}</td>
                    <td className="px-3 py-2">
                      {o.customerName}
                      <div className="text-xs text-gray-500">{o.customerEmail}</div>
                    </td>
                    <td className="px-3 py-2">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 py-2">{o.itemCount}</td>
                    <td className="px-3 py-2 font-semibold">{formatPrice(o.total)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link to={`/admin/orders/${o.id}`} className={btn}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
              <button className={btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.page} of {data.totalPages}
              </span>
              <button className={btn} disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}