import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, uploadImage } from '../../api';
import { useFetch } from '../../useFetch';
import { ErrorBox } from '../../components/States';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

// Outside the form component on purpose, so inputs keep focus while typing
function Field({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input id={id} {...props} className={field} />
    </div>
  );
}

function ProductForm({ initial }) {
  const navigate = useNavigate();
  const categories = useFetch('/categories');

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial ? String(initial.price) : '',
    discount: String(initial?.discount ?? 0),
    stock: String(initial?.stock ?? 0),
    imageUrl: initial?.imageUrl ?? '',
    categoryId: initial ? String(initial.categoryId) : '',
  });
  const [specs, setSpecs] = useState(() => {
    const rows = Object.entries(initial?.specs ?? {}).map(([key, value]) => ({ key, value }));
    return rows.length ? rows : [{ key: '', value: '' }];
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setSpec = (i, part) => (e) =>
    setSpecs(specs.map((row, idx) => (idx === i ? { ...row, [part]: e.target.value } : row)));

  const categoryList = categories.data ? categories.data.flatMap((c) => [c, ...c.children]) : [];

  async function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError('Image must be 2 MB or smaller');
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function validate() {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters';
    if (!(Number(form.price) > 0)) return 'Price must be greater than 0';
    const d = Number(form.discount);
    if (!Number.isInteger(d) || d < 0 || d > 90) return 'Discount must be a whole number from 0 to 90';
    const s = Number(form.stock);
    if (!Number.isInteger(s) || s < 0) return 'Stock must be a whole number, 0 or more';
    if (!form.imageUrl.trim()) return 'Add an image (upload one or paste a link)';
    if (!form.categoryId) return 'Choose a category';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting || uploading) return;

    const problem = validate();
    if (problem) return setError(problem);

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      discount: Number(form.discount),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
      categoryId: Number(form.categoryId),
      specs: Object.fromEntries(
        specs.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value.trim()])
      ),
    };

    setError('');
    setSubmitting(true);
    try {
      await api(initial ? `/admin/products/${initial.id}` : '/admin/products', {
        method: initial ? 'PUT' : 'POST',
        body,
      });
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{initial ? `Edit ${initial.name}` : 'Add product'}</h1>
        <Link to="/admin/products" className="text-sm text-indigo-600 underline">
          ← Back to products
        </Link>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <legend className="px-1 text-lg font-semibold">Basic details</legend>
        <Field label="Name" id="name" value={form.name} onChange={set('name')} maxLength={120} />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={set('description')}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select id="categoryId" value={form.categoryId} onChange={set('categoryId')} className={field}>
            <option value="">Choose a category</option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `– ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <legend className="px-1 text-lg font-semibold">Price and stock</legend>
        <Field label="Price (₹)" id="price" type="number" min="1" step="any" value={form.price} onChange={set('price')} />
        <Field label="Discount (%)" id="discount" type="number" min="0" max="90" value={form.discount} onChange={set('discount')} />
        <Field label="Stock" id="stock" type="number" min="0" value={form.stock} onChange={set('stock')} />
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <legend className="px-1 text-lg font-semibold">Image</legend>
        <div className="flex flex-wrap items-start gap-4">
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Product preview" className="h-28 w-28 rounded-lg border border-gray-200 object-cover" />
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label htmlFor="file" className="mb-1 block text-sm font-medium">
                Upload an image (JPG, PNG or WebP, up to 2 MB)
              </label>
              <input
                id="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFile}
                disabled={uploading}
                className="block w-full text-sm"
              />
              {uploading && (
                <p role="status" className="mt-1 text-sm text-gray-500">
                  Uploading…
                </p>
              )}
            </div>
            <Field label="Or paste an image link" id="imageUrl" value={form.imageUrl} onChange={set('imageUrl')} maxLength={500} placeholder="https://…" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <legend className="px-1 text-lg font-semibold">Specifications</legend>
        {specs.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              aria-label={`Specification name ${i + 1}`}
              placeholder="e.g. RAM"
              value={row.key}
              onChange={setSpec(i, 'key')}
              maxLength={40}
              className={field}
            />
            <input
              aria-label={`Specification value ${i + 1}`}
              placeholder="e.g. 8GB"
              value={row.value}
              onChange={setSpec(i, 'value')}
              maxLength={80}
              className={field}
            />
            <button
              type="button"
              onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}
              aria-label={`Remove specification ${i + 1}`}
              className="rounded-lg border border-gray-300 px-3 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSpecs([...specs, { key: '', value: '' }])}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          + Add specification
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create product'}
      </button>
    </form>
  );
}

// Loads the product first when editing
function EditLoader({ id }) {
  const { data, loading, error, retry } = useFetch(`/products/${id}`);
  if (loading) {
    return (
      <p role="status" className="py-16 text-center text-gray-500">
        Loading product…
      </p>
    );
  }
  if (error) return <ErrorBox message={error} onRetry={retry} />;
  return <ProductForm key={data.id} initial={data} />;
}

export default function AdminProductForm() {
  const { id } = useParams(); // present on /admin/products/:id, missing on /admin/products/new
  return id ? <EditLoader id={id} /> : <ProductForm initial={null} />;
}