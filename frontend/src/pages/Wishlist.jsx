import { Link } from 'react-router-dom';
import { useShop } from '../ShopContext';
import ProductCard from '../components/ProductCard';
import { GRID } from '../components/States';

export default function Wishlist() {
  const { wishlist } = useShop();

  return (
    <section aria-label="Wishlist">
      <h1 className="mb-4 text-2xl font-bold">Your wishlist ({wishlist.length})</h1>
      {wishlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="font-medium">Nothing saved yet</p>
          <p className="mt-1 text-sm text-gray-500">Tap the heart on any product to save it here.</p>
          <Link to="/products" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700">
            Browse products
          </Link>
        </div>
      ) : (
        <div className={GRID}>
          {wishlist.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}