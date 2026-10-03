import { useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { data, loading, error, retry } = useFetch('/admin/users');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function setRole(u, role) {
    if (busy) return;
    const text = role === 'ADMIN' ? `Make ${u.name} an admin?` : `Remove admin rights from ${u.name}?`;
    if (!window.confirm(text)) return;
    setBusy(true);
    setMessage('');
    try {
      await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role } });
      retry();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p role="status" className="py-12 text-center text-gray-500">
        Loading users…
      </p>
    );
  }
  if (error) return <ErrorBox message={error} onRetry={retry} />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users ({data.length})</h1>

      {message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium">Name</th>
              <th scope="col" className="px-3 py-3 font-medium">Email</th>
              <th scope="col" className="px-3 py-3 font-medium">Role</th>
              <th scope="col" className="px-3 py-3 font-medium">Orders</th>
              <th scope="col" className="px-3 py-3 font-medium">Joined</th>
              <th scope="col" className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium">
                  {u.name}
                  {u.id === me.id && <span className="ml-1 text-xs text-gray-500">(you)</span>}
                </td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {u.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="px-3 py-2">{u.orderCount}</td>
                <td className="px-3 py-2">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-3 py-2">
                  {u.id === me.id ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRole(u, u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {u.role === 'ADMIN' ? 'Make customer' : 'Make admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}