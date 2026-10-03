import { Link, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-500">That page does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
        Go to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />

          {/* These pages need a logged-in user */}
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
        © INFY Store
      </footer>
    </div>
  );
}