
import AddToCart from '../components/AddToCart';
import ReviewForm from '../components/ReviewForm';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../useFetch';
import { formatPrice } from '../utils';
import Rating from '../components/Rating';
import { ErrorBox } from '../components/States';

export default function ProductDetail() {
  const { id } = useParams();
  const { data: p, loading, error, retry } = useFetch(`/products/${id}`);

  if (loading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading product…
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} onRetry={retry} />
        <Link to="/products" className="text-indigo-600 underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  const specs = Object.entries(p.specs || {});
  const outOfStock = p.stock === 0;
  const lowStock = p.stock > 0 && p.stock <= 5;

  return (
    <article className="space-y-10">
      <Link to="/products" className="text-sm text-indigo-600 hover:underline">
        ← Back to products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover" />
        </div>

        <div>
          <p className="text-sm text-gray-500">{p.category.name}</p>
          <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
          <div className="mt-2">
            <Rating rating={p.rating} count={p.ratingCount} />
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(p.finalPrice)}</span>
            {p.discount > 0 && (
              <>
                <span className="text-lg text-gray-500 line-through">{formatPrice(p.price)}</span>
                <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700">
                  {p.discount}% off
                </span>
              </>
            )}
          </div>

          <p
            className={`mt-3 font-medium ${
              outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {outOfStock ? 'Out of stock' : lowStock ? `Only ${p.stock} left` : 'In stock'}
          </p>

          <p className="mt-4 text-gray-700">{p.description}</p>

          <AddToCart product={p} />
        </div>
      </div>

      {specs.length > 0 && (
        <section aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="mb-3 text-xl font-semibold">
            Specifications
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <tbody>
                {specs.map(([name, value]) => (
                  <tr key={name} className="border-b border-gray-100 last:border-0">
                    <th scope="row" className="w-1/3 bg-gray-50 px-4 py-3 font-medium">
                      {name}
                    </th>
                    <td className="px-4 py-3">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="mb-3 text-xl font-semibold">
          Reviews ({p.ratingCount})
        </h2>

        <ReviewForm productId={p.id} onDone={retry} />
        {p.reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {p.reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.userName}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="mt-1 text-amber-600" aria-label={`${r.rating} out of 5 stars`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span>
                </p>
                <p className="mt-1 text-gray-700">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}