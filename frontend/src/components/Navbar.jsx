import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const text = q.trim();
    navigate(text ? `/products?search=${encodeURIComponent(text)}` : '/products');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          INFY Store
        </Link>

        <nav aria-label="Main">
          <Link
            to="/products"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            All products
          </Link>
        </nav>

        <form onSubmit={onSubmit} role="search" className="order-last flex w-full gap-2 sm:order-none sm:ml-auto sm:w-auto sm:flex-1 sm:max-w-md">
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
      </div>
    </header>
  );
}