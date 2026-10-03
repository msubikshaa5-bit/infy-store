import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading…
      </p>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.role !== 'ADMIN') {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold">Admin access only</h1>
        <p className="mt-2 text-gray-500">Your account does not have permission to open this area.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
          Go to home
        </Link>
      </div>
    );
  }

  const tab = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="space-y-6">
      <nav aria-label="Admin" className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
        <NavLink to="/admin" end className={tab}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/products" className={tab}>
          Products
        </NavLink>
        <NavLink to="/admin/categories" className={tab}>
          Categories
        </NavLink>
        <NavLink to="/admin/orders" className={tab}>
          Orders
        </NavLink>
        <NavLink to="/admin/users" className={tab}>
          Users
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}