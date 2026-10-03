import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useShop } from '../ShopContext';

export default function ReviewForm({ productId, onDone }) {
  const { user } = useAuth();
  const { notify } = useShop();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <p className="mb-4 text-sm text-gray-600">
        <Link to="/login" state={{ from: `/products/${productId}` }} className="text-indigo-600 underline">
          Log in
        </Link>{' '}
        to write a review.
      </p>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!comment.trim()) return setError('Write a short comment');
    setError('');
    setSubmitting(true);
    try {
      await api(`/products/${productId}/reviews`, { method: 'POST', body: { rating, comment } });
      notify('Thanks for your review');
      onDone();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="font-medium">Write a review</h3>
      <div>
        <label htmlFor="rating" className="mb-1 block text-sm font-medium">
          Rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium">
          Comment
        </label>
        <textarea
          id="comment"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}