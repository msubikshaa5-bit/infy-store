import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useShop } from '../ShopContext';

const link =
  'text-sm font-medium text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, wishlist } = useShop();
  const [q, setQ] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const text = q.trim();
    navigate(text ? `/products?search=${encodeURIComponent(text)}` : '/products');
  }

  function onLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          INFY Store
        </Link>

        <Link to="/products" className={link}>
          All products
        </Link>

        <form
          onSubmit={onSubmit}
          role="search"
          className="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:max-w-md sm:flex-1"
        >
          <label htmlFor="nav-search" className="sr-only">
            Search products
          </label>
          <input
            id="nav-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
            placeholder="Search phones…"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Search
          </button>
        </form>

        <nav aria-label="Account" className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          {user && <span className="hidden max-w-[10rem] truncate text-sm text-gray-500 md:inline">Hi, {user.name}</span>}
          <Link to="/wishlist" className={link}>
            Wishlist{user ? ` (${wishlist.length})` : ''}
          </Link>
          <Link to="/cart" className={link}>
            Cart ({cart.itemCount})
          </Link>
          {user ? (
            <>
              <Link to="/orders" className={link}>
                Orders
              </Link>

              {user.role === 'ADMIN' && (
                <Link to="/admin" className={link}>
                  Admin
                </Link>
              )}
              <button type="button" onClick={onLogout} className={link}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}