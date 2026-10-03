import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    // Quick checks in the browser. The server checks everything again.
    if (isRegister && form.name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address');
    if (!form.password) return setError('Password is required');
    if (isRegister && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))) {
      return setError('Password must be at least 8 characters and include a letter and a number');
    }

    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Log in'}</h1>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input id="name" autoComplete="name" value={form.name} onChange={set('name')} maxLength={50} className={field} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} className={field} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
            maxLength={72}
            className={field}
          />
          {isRegister && (
            <p className="mt-1 text-xs text-gray-500">At least 8 characters, with a letter and a number.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link
          to={isRegister ? '/login' : '/register'}
          state={location.state}
          className="text-indigo-600 underline"
        >
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}