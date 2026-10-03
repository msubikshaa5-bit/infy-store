import { Link } from 'react-router-dom';
import { useFetch } from '../useFetch';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons, ErrorBox } from '../components/States';

const FOUR = 'grid grid-cols-2 gap-4 md:grid-cols-4';

export default function Home() {
  const categories = useFetch('/categories');
  const latest = useFetch('/products?limit=4&sort=newest');

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-indigo-600 px-6 py-12 text-white sm:px-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Find your next smartphone</h1>
        <p className="mt-3 max-w-xl text-indigo-100">
          Compare specs, check real reviews and pick the phone that fits your budget.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
        >
          Shop now
        </Link>
      </section>

      <section aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="mb-3 text-xl font-semibold">
          Shop by category
        </h2>
        {categories.loading ? (
          <p className="text-gray-500">Loading categories…</p>
        ) : categories.error ? (
          <ErrorBox message={categories.error} onRetry={categories.retry} />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {categories.data
              .flatMap((c) => [c, ...c.children])
              .map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/products?category=${c.id}`}
                    className="inline-block rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:border-indigo-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="new-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="new-heading" className="text-xl font-semibold">
            New arrivals
          </h2>
          <Link to="/products" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {latest.loading ? (
          <ProductSkeletons count={4} className={FOUR} />
        ) : latest.error ? (
          <ErrorBox message={latest.error} onRetry={latest.retry} />
        ) : (
          <div className={FOUR}>
            {latest.data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}