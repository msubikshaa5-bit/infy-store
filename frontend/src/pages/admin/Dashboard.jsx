import { Link } from 'react-router-dom';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';
import { formatPrice, statusLabel, statusStyle } from '../../utils';

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, retry } = useFetch('/admin/stats');

  if (loading) {
    return (
      <p role="status" className="py-16 text-center text-gray-500">
        Loading dashboard…
      </p>
    );
  }
  if (error) return <ErrorBox message={error} onRetry={retry} />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Total products" value={data.totalProducts} />
        <Card label="Customers" value={data.totalUsers} />
        <Card label="Total orders" value={data.totalOrders} />
        <Card label="Revenue" value={formatPrice(data.revenue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="low-heading" className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 id="low-heading" className="mb-3 text-lg font-semibold">
            Low stock ({data.lowStockLimit} or fewer)
          </h2>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link to={`/admin/products/${p.id}`} className="font-medium text-indigo-600 hover:underline">
                    {p.name}
                  </Link>
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-heading" className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 id="recent-heading" className="mb-3 text-lg font-semibold">
            Recent orders
          </h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <Link to={`/admin/orders/${o.id}`} className="font-medium text-indigo-600 hover:underline">
                    #{o.id} · {o.customerName}
                  </Link>
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}