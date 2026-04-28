# K.T Digital House — Project Memory

## Original Problem Statement
Get the webapp from GitHub repo https://github.com/Rishvy/digitalHouse up and running.

## Architecture Overview
- **Stack**: Next.js 16.2.4 (Turbopack), TypeScript, Tailwind CSS v4
- **Database/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Design Editor**: canva-editor (fabric.js based)
- **Payments**: Razorpay / Cashfree (configured but keys not yet set)
- **Email**: Brevo (configured but key not yet set)

## Service Setup (Emergent Environment)
- **Port 3000**: Next.js dev server (started from `/app/frontend` shim)
- **Port 8001**: FastAPI reverse proxy (`/app/backend/server.py`) — forwards all `/api/*` to Next.js port 3000
- **Supabase**: Remote hosted at `https://ybggextouoexzwwflogq.supabase.co`

## Key Files
- `/app/.env.local` — Supabase credentials & app URL
- `/app/frontend/package.json` — Supervisor shim to start Next.js
- `/app/backend/server.py` — FastAPI proxy forwarding /api/* to Next.js
- `/app/next.config.ts` — Added Emergent preview domain to allowedDevOrigins
- `/app/src/` — All app source code
- `/app/supabase/migrations/` — Database schema (20+ migration files)

## App Pages & Features
### Storefront (`/`)
- Landing page with hero, product categories
- Product listing & detail pages
- Cart (Zustand store)
- Wishlist (Zustand store)
- Checkout flow
- Order tracking
- User account / auth

### Admin (`/admin`)
- Dashboard with analytics
- Product management
- Category management
- Order management
- Template management
- Upload management
- Homepage section management
- User management
- Seed data tool

### Design Editor (`/design/[productId]`)
- canva-editor based design tool
- Product-specific print specs
- Template selection
- Export to PNG

### API Routes (`/api/*`)
- `/api/editor/*` — Design editor assets (fonts, templates, shapes, etc.)
- `/api/payments/*` — Payment gateway integration
- `/api/orders/*` — Order management
- `/api/storage/*` — File storage
- `/api/pricing/*` — Pricing calculator
- `/api/search/*` — Product search
- `/api/webhooks/*` — Payment webhooks

## Environment Variables Set
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `NEXT_PUBLIC_APP_URL` ✓

## Pending / Not Yet Configured
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` / `CASHFREE_WEBHOOK_SECRET`
- `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME`
- `REDIS_URL`

## What's Been Implemented (Setup)
- [2026-04-28] Cloned & set up GitHub repo in Emergent environment
- [2026-04-28] Created `.env.local` with Supabase credentials
- [2026-04-28] Installed npm dependencies (node_modules)
- [2026-04-28] Created `/app/frontend` supervisor shim (Next.js on port 3000)
- [2026-04-28] Created `/app/backend/server.py` FastAPI proxy (port 8001 → 3000)
- [2026-04-28] Updated `next.config.ts` with Emergent preview domain

## What's Been Implemented
- [2026-04-28] Setup: env, supervisor shim, FastAPI proxy, allowedDevOrigins
- [2026-04-28] Sandwich-method configurator v1 (with template selection gallery)
- [2026-04-28] Sandwich-method configurator v2 (correct flow per spec):
  - Admin sets 0 or 1 template per product (product.template_id → templates.preview_url)
  - User selects quantity → must upload exactly that many photos
  - Upload progress bar + counter (N/required)
  - Preview button gated: disabled until all images uploaded
  - Preview modal: sandwich canvas (photo + template overlay), or plain photo if no template
  - Prev/Next navigation across all uploaded images, each with independent posX/posY/scale
  - Zoom in/out/reset controls (only shown when template overlay exists)
  - Per-image transforms saved on navigation and Add to Cart
  - Cart item includes printTransforms[] with imageUrl + coordinates for print backend
  - "Added to Cart!" success flash for 1.4s before modal auto-closes
- [2026-04-28] Mobile responsiveness (verified by testing agent iteration_3):
  - CatalogSidebar: collapsible with "Filters" toggle on mobile (<768px), always open on desktop
  - Homepage hero: text-4xl scaling up through sm/md/lg breakpoints, prevents overflow
  - Footer: grid-cols-2 on mobile (brand spans 2 cols), md:grid-cols-4 on desktop
  - Checkout: Order Summary appears first on mobile (order-1), 2-col layout preserved on desktop
  - My Account: horizontal scrollable tabs on mobile, vertical sidebar on desktop
  - Track Order stepper: text-[10px] sm:text-xs + flex-1 min-w-0 prevents label overflow

## Prioritized Backlog
### P0 (Critical for full functionality)
- [ ] Run Supabase migrations if not already applied
- [ ] Add seed data / verify database schema is set up
- [ ] Test auth flow (login/signup)

### P1 (Important features)
- [ ] Configure Razorpay or Cashfree for payments
- [ ] Configure Brevo for email notifications
- [ ] Configure Redis for queue/jobs

### P2 (Nice to have)
- [ ] Configure Inngest for background jobs
- [ ] Set up Supabase Storage buckets
- [ ] Configure production deployment
