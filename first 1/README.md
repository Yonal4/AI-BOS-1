# AI BOS

AI BOS is an AI Business Operating System with collaborating agents for marketing, sales, support, analytics, Company Brain, and Stripe billing.

## Project Structure

```txt
api/                  Vercel serverless Express adapter
archive/legacy/       Old generated snapshots kept for reference
netlify/functions/    Netlify serverless Express adapter
server/               Backend services and API routes
src/                  React application
attached_assets/      Local design/reference assets
server.js             Express app entry point
vite.config.ts        Vite config
vercel.json           Vercel deployment config
netlify.toml          Netlify deployment config
railway.json          Railway deployment config
.replit               Replit deployment config
DEPLOYMENT.md         Hosting setup guide
```

## Local Development

```bash
npm install
npm run dev
```

Frontend runs on port `5000`; backend runs on port `3001`.

## Production Build

```bash
npm install
npm run build
npm run start:prod
```

See `DEPLOYMENT.md` for Replit, Vercel, and Netlify settings.
