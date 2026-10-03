import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';
import { formatPrice } from '../../utils';

const btn =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function AdminProducts() {
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, retry } = useFetch(
    `/admin/products?page=${page}&search=${encodeURIComponent(term)}`
  );

  function onSearch(e) {
    e.preventDefault();
    setPage(1);
    setTerm(text.trim());
  }

  async function remove(p) {
    if (busy) return;
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setBusy(true);
    setMessage('');
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' });
      retry();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          to="/admin/products/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          + Add product
        </Link>
      </div>

      <form onSubmit={onSearch} role="search" className="flex gap-2">
        <label htmlFor="admin-search" className="sr-only">
          Search products
        </label>
        <input
          id="admin-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={100}
          placeholder="Search by name…"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:max-w-sm"
        />
        <button type="submit" className={btn}>
          Search
        </button>
      </form>

      {message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-12 text-center text-gray-500">
          Loading products…
        </p>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : data.products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No products found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">Product</th>
                  <th scope="col" className="px-3 py-3 font-medium">Category</th>
                  <th scope="col" className="px-3 py-3 font-medium">Price</th>
                  <th scope="col" className="px-3 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p.category.name}</td>
                    <td className="px-3 py-2">
                      {formatPrice(p.finalPrice)}
                      {p.discount > 0 && <span className="ml-1 text-xs text-gray-500">({p.discount}% off)</span>}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${p.stock <= 5 ? 'text-red-600' : ''}`}>{p.stock}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Link to={`/admin/products/${p.id}`} className={btn}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => remove(p)}
                          className={`${btn} border-red-300 text-red-700 hover:bg-red-50`}
                        >
                          Delete
                        </button>
                      </div>
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