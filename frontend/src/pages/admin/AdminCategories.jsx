import { useState } from 'react';
import { api } from '../../api';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const small =
  'rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50';

export default function AdminCategories() {
  const { data, loading, error, retry } = useFetch('/categories');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Runs one action with the double-click lock and error message
  async function run(fn) {
    if (busy) return false;
    setBusy(true);
    setMessage('');
    try {
      await fn();
      retry();
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    if (name.trim().length < 2) return setMessage('Name must be at least 2 characters');
    const ok = await run(() =>
      api('/admin/categories', {
        method: 'POST',
        body: { name: name.trim(), parentId: parentId ? Number(parentId) : null },
      })
    );
    if (ok) setName('');
  }

  function rename(c) {
    const next = window.prompt('New name', c.name);
    if (next === null) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'PUT', body: { name: next } }));
  }

  function remove(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    run(() => api(`/admin/categories/${c.id}`, { method: 'DELETE' }));
  }

  function Row({ c, child }) {
    return (
      <li className={`flex flex-wrap items-center justify-between gap-2 py-2 ${child ? 'pl-6' : ''}`}>
        <span className={child ? 'text-sm' : 'font-medium'}>{child ? `– ${c.name}` : c.name}</span>
        <span className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => rename(c)} className={small}>
            Rename
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => remove(c)}
            className={`${small} border-red-300 text-red-700 hover:bg-red-50`}
          >
            Delete
          </button>
        </span>
      </li>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <form onSubmit={add} noValidate className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">Add a category</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cat-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className={field} />
          </div>
          <div>
            <label htmlFor="cat-parent" className="mb-1 block text-sm font-medium">
              Parent
            </label>
            <select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className={field}>
              <option value="">None (main category)</option>
              {(data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          Add category
        </button>
      </form>

      {message && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {message}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-8 text-center text-gray-500">
          Loading categories…
        </p>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4">
          {data.map((c) => (
            <li key={c.id} className="list-none">
              <ul>
                <Row c={c} />
                {c.children.map((k) => (
                  <Row key={k.id} c={k} child />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}