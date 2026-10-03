import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_URL || 'http://localhost:5000/api';

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }
  return { status: res.status, data };
}

const email = `test${Date.now()}@example.com`;
const password = 'Test@1234';
let customerToken;

test('health check works', async () => {
  const { status, data } = await call('/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

test('product list returns products with a final price', async () => {
  const { status, data } = await call('/products');
  assert.equal(status, 200);
  assert.ok(data.products.length > 0);
  assert.ok('finalPrice' in data.products[0]);
});

test('invalid product id is rejected with 400', async () => {
  assert.equal((await call('/products/abc')).status, 400);
});

test('missing product returns 404', async () => {
  assert.equal((await call('/products/999999')).status, 404);
});

test('weak password is rejected', async () => {
  const { status } = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email, password: 'abc' },
  });
  assert.equal(status, 400);
});

test('customer can register', async () => {
  const { status, data } = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email, password },
  });
  assert.equal(status, 201);
  assert.ok(data.token);
  assert.equal(data.user.role, 'CUSTOMER');
  assert.equal(data.user.password, undefined); // the hash is never returned
  customerToken = data.token;
});

test('duplicate email is rejected with 409', async () => {
  const { status } = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email, password },
  });
  assert.equal(status, 409);
});

test('wrong password is rejected with 401', async () => {
  const { status } = await call('/auth/login', {
    method: 'POST',
    body: { email, password: 'wrong-password' },
  });
  assert.equal(status, 401);
});

test('cart needs login', async () => {
  assert.equal((await call('/cart')).status, 401);
});

test('cart rejects a quantity that is too large', async () => {
  const { status } = await call('/cart', {
    method: 'POST',
    token: customerToken,
    body: { productId: 1, quantity: 99 },
  });
  assert.equal(status, 400);
});

test('checkout with an empty cart is refused', async () => {
  const { status, data } = await call('/orders', {
    method: 'POST',
    token: customerToken,
    body: {
      address: {
        fullName: 'Test User',
        phone: '9876543210',
        line1: '12 Main Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
      },
      paymentMethod: 'UPI',
    },
  });
  assert.equal(status, 400);
  assert.equal(data.message, 'Your cart is empty');
});

test('a customer cannot open the admin dashboard (403)', async () => {
  const { status } = await call('/admin/stats', { token: customerToken });
  assert.equal(status, 403);
});

test('admin routes need a token (401)', async () => {
  assert.equal((await call('/admin/stats')).status, 401);
});

test('admin can open the dashboard', async () => {
  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: 'admin@infy.com', password: 'Admin@123' },
  });
  assert.equal(login.status, 200);
  const { status, data } = await call('/admin/stats', { token: login.data.token });
  assert.equal(status, 200);
  assert.ok('totalProducts' in data);
});

test('INFY AI needs login', async () => {
  const { status } = await call('/ai/chat', { method: 'POST', body: { message: 'best phone' } });
  assert.equal(status, 401);
});