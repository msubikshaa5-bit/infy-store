import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useShop } from '../ShopContext';
import { formatPrice } from '../utils';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

// Defined OUTSIDE Checkout on purpose: inside it, the input would lose focus on every keystroke
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

const METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Credit / debit card' },
  { value: 'COD', label: 'Cash on delivery' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartLoading, refreshCart } = useShop();

  const [addr, setAddr] = useState({ fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' });
  const [method, setMethod] = useState('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setAddr({ ...addr, [key]: e.target.value });

  if (cartLoading) {
    return (
      <p role="status" className="py-20 text-center text-gray-500">
        Loading…
      </p>
    );
  }

  if (cart.items.length === 0 && !submitting) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Link to="/products" className="mt-3 inline-block text-indigo-600 underline">
          Browse products
        </Link>
      </div>
    );
  }

  if (cart.items.some((i) => i.stock === 0 || i.quantity > i.stock)) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Some items in your cart are no longer available in that quantity.</p>
        <Link to="/cart" className="mt-3 inline-block text-indigo-600 underline">
          Go back to your cart
        </Link>
      </div>
    );
  }

  function validate() {
    if (addr.fullName.trim().length < 2) return 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(addr.phone.trim())) return 'Enter a valid 10-digit mobile number';
    if (addr.line1.trim().length < 5) return 'Enter your full street address';
    if (addr.city.trim().length < 2) return 'Enter your city';
    if (addr.state.trim().length < 2) return 'Enter your state';
    if (!/^\d{6}$/.test(addr.pincode.trim())) return 'Pincode must be 6 digits';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return; // duplicate-click protection

    const problem = validate();
    if (problem) return setError(problem);

    setError('');
    setSubmitting(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: { address: addr, paymentMethod: method, simulateFailure },
      });
      navigate(`/orders/${order.id}`, { replace: true, state: { placed: true } });
      refreshCart(); // the server emptied the cart, so update the badge
    } catch (err) {
      setError(err.message);
      refreshCart(); // stock may have changed, so show the latest cart
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Checkout</h1>

        <fieldset className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <legend className="px-1 text-lg font-semibold">1. Delivery address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" id="fullName" autoComplete="name" value={addr.fullName} onChange={set('fullName')} maxLength={60} />
            <Field label="Mobile number" id="phone" type="tel" inputMode="numeric" autoComplete="tel" value={addr.phone} onChange={set('phone')} maxLength={10} />
          </div>
          <Field label="Street address" id="line1" autoComplete="street-address" value={addr.line1} onChange={set('line1')} maxLength={120} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" id="city" value={addr.city} onChange={set('city')} maxLength={50} />
            <Field label="State" id="state" value={addr.state} onChange={set('state')} maxLength={50} />
            <Field label="Pincode" id="pincode" inputMode="numeric" autoComplete="postal-code" value={addr.pincode} onChange={set('pincode')} maxLength={6} />
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <legend className="px-1 text-lg font-semibold">2. Payment (simulated)</legend>
          <p className="text-sm text-gray-500">No real payment happens and no card details are collected.</p>
          {METHODS.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="method"
                value={m.value}
                checked={method === m.value}
                onChange={() => setMethod(m.value)}
                className="h-4 w-4"
              />
              {m.label}
            </label>
          ))}
          <label className="flex items-center gap-2 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="h-4 w-4"
            />
            Test mode: make the payment fail
          </label>
        </fieldset>
      </div>

      <aside aria-label="Order summary" className="mt-6 h-fit space-y-3 rounded-xl border border-gray-200 bg-white p-4 lg:mt-12">
        <h2 className="text-lg font-semibold">3. Order summary</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {i.name} × {i.quantity}
              </span>
              <span>{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Processing payment…' : method === 'COD' ? 'Place order' : `Pay ${formatPrice(cart.subtotal)}`}
        </button>
        <Link to="/cart" className="block text-center text-sm text-indigo-600 underline">
          Back to cart
        </Link>
      </aside>
    </form>
  );
}