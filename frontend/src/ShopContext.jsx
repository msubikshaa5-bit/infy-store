import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

const ShopContext = createContext(null);
const EMPTY_CART = { items: [], subtotal: 0, itemCount: 0 };

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const lock = useRef(false); // blocks a second action while one is running
  const timer = useRef(null);

  function notify(text, type = 'ok') {
    setToast({ text, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }

  // Load the cart and wishlist whenever the logged-in user changes
  useEffect(() => {
    if (!user) {
      setCart(EMPTY_CART);
      setWishlist([]);
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    api('/cart')
      .then(setCart)
      .catch(() => {})
      .finally(() => setCartLoading(false));
    api('/wishlist')
      .then(setWishlist)
      .catch(() => {});
  }, [user]);

  async function refreshCart() {
    try {
      setCart(await api('/cart'));
    } catch {
      // ignore: the next action will show an error if the server is down
    }
  }

  // Wraps every cart/wishlist action: login check, double-click lock, error message
  async function act(fn, okText) {
    if (!user) {
      notify('Please log in first', 'error');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    }
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      await fn();
      if (okText) notify(okText);
      return true;
    } catch (err) {
      notify(err.message, 'error');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const inWishlist = (id) => wishlist.some((p) => p.id === id);

  const addToCart = (productId, quantity = 1) =>
    act(async () => setCart(await api('/cart', { method: 'POST', body: { productId, quantity } })), 'Added to cart');

  const updateQty = (productId, quantity) =>
    act(async () => setCart(await api(`/cart/${productId}`, { method: 'PUT', body: { quantity } })));

  const removeItem = (productId) =>
    act(async () => setCart(await api(`/cart/${productId}`, { method: 'DELETE' })), 'Removed from cart');

  const toggleWishlist = (productId) =>
    act(
      async () => {
        await api(`/wishlist/${productId}`, { method: inWishlist(productId) ? 'DELETE' : 'POST' });
        setWishlist(await api('/wishlist'));
      },
      inWishlist(productId) ? 'Removed from wishlist' : 'Added to wishlist'
    );

  const value = {
    cart, cartLoading, wishlist, busy,
    addToCart, updateQty, removeItem, toggleWishlist, inWishlist, refreshCart, notify,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {toast && (
          <p
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            }`}
          >
            {toast.text}
          </p>
        )}
      </div>
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}