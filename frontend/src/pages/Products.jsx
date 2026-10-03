import { Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../useFetch';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorBox, GRID } from '../components/States';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
const btn =
  'rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();

  const { data, loading, error, retry } = useFetch(`/products?${query}`);
  const { data: categories } = useFetch('/categories');

  const search = params.get('search');
  const hasFilters = query !== '';

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    else window.scrollTo({ top: 0 });
    setParams(next);
  }

  function applyPrice(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    update({ minPrice: form.get('minPrice'), maxPrice: form.get('maxPrice') });
  }

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside
        aria-label="Filters"
        className="mb-6 space-y-5 rounded-xl border border-gray-200 bg-white p-4 lg:mb-0 lg:self-start"
      >
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            className={field}
            value={params.get('category') || ''}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {(categories || []).map((c) => (
              <Fragment key={c.id}>
                <option value={c.id}>{c.name}</option>
                {c.children.map((k) => (
                  <option key={k.id} value={k.id}>
                    &nbsp;&nbsp;– {k.name}
                  </option>
                ))}
              </Fragment>
            ))}
          </select>
        </div>

        <form
          key={`${params.get('minPrice')}-${params.get('maxPrice')}`}
          onSubmit={applyPrice}
        >
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Price (₹)</legend>
            <div className="flex gap-2">
              <input
                name="minPrice"
                type="number"
                min="0"
                placeholder="Min"
                aria-label="Minimum price"
                defaultValue={params.get('minPrice') ?? ''}
                className={field}
              />
              <input
                name="maxPrice"
                type="number"
                min="0"
                placeholder="Max"
                aria-label="Maximum price"
                defaultValue={params.get('maxPrice') ?? ''}
                className={field}
              />
            </div>
            <button type="submit" className={`${btn} mt-2 w-full`}>
              Apply price
            </button>
          </fieldset>
        </form>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={params.get('inStock') === 'true'}
            onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })}
            className="h-4 w-4"
          />
          In stock only
        </label>

        {hasFilters && (
          <button onClick={() => setParams({})} className={`${btn} w-full`}>
            Clear all filters
          </button>
        )}
      </aside>

      <section aria-label="Products">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {search ? `Results for “${search}”` : 'All products'}
            </h1>
            {data && (
              <p className="text-sm text-gray-500" role="status">
                {data.total} {data.total === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600">
              Sort by
            </label>
            <select
              id="sort"
              className={`${field} w-auto`}
              value={params.get('sort') || 'newest'}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <ProductSkeletons />
        ) : error ? (
          <ErrorBox message={error} onRetry={retry} />
        ) : data.products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-medium">No products match your filters</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search or remove a filter.</p>
            <button onClick={() => setParams({})} className={`${btn} mt-4`}>
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className={GRID}>
              {data.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
                <button
                  className={btn}
                  disabled={data.page <= 1}
                  onClick={() => update({ page: data.page - 1 })}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  className={btn}
                  disabled={data.page >= data.totalPages}
                  onClick={() => update({ page: data.page + 1 })}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}