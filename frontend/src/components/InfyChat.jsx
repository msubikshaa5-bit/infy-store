import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useShop } from '../ShopContext';
import { formatPrice } from '../utils';

const GREETING = {
  role: 'assistant',
  text: 'Hi, I am INFY. Tell me your budget and what you need, and I will pick phones from our store, compare them and explain why.',
};

const SUGGESTIONS = [
  'Best phone under ₹30,000 with a good camera',
  'Compare Nova X1 and Pulse Pro',
  'Which phone is best for a college student?',
  'Gaming phone with 12GB RAM',
];

// Small product card shown inside the chat
function MiniCard({ p }) {
  const { addToCart, busy } = useShop();
  return (
    <li className="flex gap-3 rounded-lg border border-gray-200 bg-white p-2">
      <img src={p.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <Link to={`/products/${p.id}`} className="block truncate text-sm font-medium hover:text-indigo-600">
          {p.name}
        </Link>
        <p className="text-sm font-semibold">
          {formatPrice(p.finalPrice)}
          {p.discount > 0 && <span className="ml-2 text-xs font-normal text-gray-500 line-through">{formatPrice(p.price)}</span>}
        </p>
        <button
          type="button"
          disabled={busy || p.stock === 0}
          onClick={() => addToCart(p.id, 1)}
          className="mt-1 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {p.stock === 0 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </li>
  );
}

function CompareTable({ table }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-2 py-1.5 font-medium">
              <span className="sr-only">Feature</span>
            </th>
            {table.columns.map((c) => (
              <th key={c} scope="col" className="px-2 py-1.5 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.label} className="border-t border-gray-100">
              <th scope="row" className="whitespace-nowrap bg-gray-50 px-2 py-1.5 font-medium">
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className="px-2 py-1.5">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InfyChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading]);

  async function send(text) {
    const message = text.trim();
    if (!message || loading) return; // loading check prevents double sends

    // Send the last 6 messages (without the greeting) so follow-up questions work
    const history = messages
      .slice(1)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 1500) }));

    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setLoading(true);
    try {
      const data = await api('/ai/chat', { method: 'POST', body: { message, history } });
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply, products: data.products, table: data.table, basic: !data.aiUsed },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="infy-panel"
        className="fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {open ? 'Close INFY' : 'Ask INFY'}
      </button>

      {open && (
        <div
          id="infy-panel"
          role="dialog"
          aria-label="INFY shopping assistant"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[75vh] flex-col rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl sm:left-auto sm:right-4 sm:w-[24rem]"
        >
          <div className="rounded-t-2xl bg-indigo-600 px-4 py-3 text-white">
            <p className="font-semibold">INFY shopping assistant</p>
            <p className="text-xs text-indigo-100">Answers use our real product data</p>
          </div>

          {!user ? (
            <div className="p-6 text-center text-sm">
              <p className="mb-3 text-gray-700">Please log in to chat with INFY.</p>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Log in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                    <div
                      className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : m.error
                            ? 'border border-red-200 bg-red-50 text-red-700'
                            : 'border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      {m.products?.length > 0 && (
                        <ul className="mt-2 space-y-2">
                          {m.products.map((p) => (
                            <MiniCard key={p.id} p={p} />
                          ))}
                        </ul>
                      )}
                      {m.table && <CompareTable table={m.table} />}
                      {m.basic && !m.error && i > 0 && (
                        <p className="mt-2 text-xs text-gray-500">Basic mode: AI explanation unavailable right now.</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <p role="status" className="text-sm text-gray-500">
                    INFY is checking our products…
                  </p>
                )}
                <div ref={endRef} />
              </div>

              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2 border-t border-gray-200 bg-white p-3"
              >
                <label htmlFor="infy-input" className="sr-only">
                  Message to INFY
                </label>
                <input
                  id="infy-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. phone under ₹30,000…"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}