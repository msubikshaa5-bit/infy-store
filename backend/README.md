# INFY Store

A complete e-commerce web application for **smartphones**, built for INFYHACKATHON 2.0.
It has a customer shop, an admin panel, and **INFY**, an AI shopping assistant that works from real product data.

- Built by: [Your name]
- Demo video (optional): [link, or delete this line]

## Features

**Customer shop**
- Home page, categories and subcategories
- Product list with search, category and price filters, in-stock filter, sorting and pagination
- Product page with image, specifications, price, discount, stock status, ratings and reviews
- Register, login, logout
- Cart (add, change quantity, remove) and wishlist
- Checkout: address, order summary, simulated payment, confirmation
- Order history and order details with a status tracker
- Responsive layout for phone, tablet and desktop; keyboard and screen-reader friendly

**Admin panel**
- Dashboard: total products, customers, orders, revenue, low-stock products, recent orders
- Add, edit and delete products, update price and stock, upload images, manage specifications
- Manage categories and subcategories
- View orders and move them through Pending, Confirmed, Processing, Shipped, Delivered
- View users and change roles

**INFY AI (shopping assistant)**
- Understands requests such as "phone under ₹30,000 with a good camera"
- Searches and ranks the real product database
- Compares products in a table built from real specs
- Explains price and spec differences and why a product suits a use case
- Falls back to a basic rule-based mode if the AI service is unavailable

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (Supabase) with Prisma ORM |
| Authentication | JWT, bcrypt password hashing |
| Validation | Zod on every API input |
| AI | Google Gemini API |

## How INFY AI works

1. Gemini turns the customer's sentence into structured filters (budget, RAM, use case, product names).
2. The backend queries the database, keeps in-stock products and ranks them.
3. The backend builds the comparison table and the price and spec differences itself.
4. Gemini writes a short explanation using only that data.

Prices and specs always come from the database, so the assistant cannot invent products.
Product descriptions are never sent to the AI.

## Security

- Passwords hashed with bcrypt and never returned by the API
- JWT authentication; customer and admin roles checked on the server for every admin route
- Input validation with Zod on all request bodies, query strings and ids
- Prisma parameterised queries (no SQL injection); React escapes output (no XSS)
- Image upload checks real file bytes, allows only JPG, PNG and WebP, limits size, uses random file names
- Prices and stock always checked on the server; checkout runs in one database transaction
- Rate limits on login, register and the AI endpoint
- Secrets only in `.env` (never committed); Helmet security headers; CORS limited to the frontend

## Reliability

- Loading, error and empty states on every page, with retry buttons
- Stock checks, duplicate-click protection and safe rollback when payment fails
- Consistent API error messages; React error boundary for unexpected crashes

## Getting started

Requirements: Node.js LTS, Git, and a free [Supabase](https://supabase.com) project for PostgreSQL.

```bash
git clone https://github.com/msubikshaa5-bit/infy-store.git
cd infy-store
```

**1. Backend**

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill it in:

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase session pooler) |
| `JWT_SECRET` | Long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PORT` | Backend port (5000) |
| `GEMINI_API_KEY` | Optional. Free key from https://aistudio.google.com. Without it INFY runs in basic mode |
| `GEMINI_MODEL` | Optional. A current Gemini Flash model ID |

Create the tables and sample data, then start the server:

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Run the seed only once on an empty database, because it creates the sample products each time.

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@infy.com | Admin@123 |
| Customer | Register on the Sign up page | |

Change the admin password before any real use.

## Tests

With the backend running:

```bash
cd backend
npm test
```

15 smoke tests check validation, login, role protection, checkout rules and AI endpoint protection.

## Project structure

```
backend/   Express API (routes, middleware, Prisma schema, seed, tests)
frontend/  React app (pages, components, contexts)
```

## Database design

`User`, `Category` (self-referencing for subcategories), `Product`, `CartItem`, `WishlistItem`, `Order`, `OrderItem` (stores the price at purchase time), `Review`.

## Known limitations

- Payment is simulated; no real gateway
- The login token is kept in localStorage; a production app should use httpOnly cookies
- Rate limits are kept in memory and reset when the server restarts
- Uploaded images are stored on the server disk
- No email verification or password reset
- Product specifications are stored as JSON text