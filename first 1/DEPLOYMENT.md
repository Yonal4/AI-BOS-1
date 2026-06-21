# AI BOS Deployment Guide

AI BOS is a full-stack app:

- Frontend: React + Vite
- Backend: Express API
- Database: PostgreSQL
- Billing: Stripe
- Auth: Clerk

## Required Environment Variables

Set these in the hosting platform before deploying:

```env
NODE_ENV=production
APP_URL=https://your-production-domain
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_BUSINESS=price_...
```

Optional Company Brain semantic search:

```env
VOYAGE_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
```

## Replit Deployment

Use the included `.replit` config.

- Deployment type: Autoscale
- Build command: `npm install && npm run build`
- Run command: `npm run start:prod`
- Secrets: add every required environment variable above

Replit provides `PORT`; the server reads it automatically.

## Vercel Deployment

Use the included `vercel.json`.

- Framework preset: Vite
- Build command: `npm install && npm run build`
- Output directory: `dist`
- API routes: `/api/*` route to `api/index.js`
- Environment variables: add every required variable above

Stripe webhook URL:

```txt
https://your-vercel-domain/api/billing/webhook
```

## Netlify Deployment

Use the included `netlify.toml`.

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Function directory: `netlify/functions`
- API routes: `/api/*` route to the Express function
- Environment variables: add every required variable above

Stripe webhook URL:

```txt
https://your-netlify-domain/api/billing/webhook
```

## Production Checklist

1. Push the latest commits to GitHub.
2. Create a PostgreSQL database.
3. Add all environment variables.
4. Create Stripe products and prices for Starter, Growth, Business.
5. Add Stripe webhook endpoint for `checkout.session.completed` and `customer.subscription.*`.
6. Deploy.
7. Test:
   - `/health`
   - Sign up / sign in
   - Marketing campaign workflow
   - Dashboard analytics
   - Billing checkout
   - Billing portal
   - Company Brain upload and search
