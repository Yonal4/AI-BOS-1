# AI BOS — AI Business Operating System

## Overview
Full-stack React + Vite frontend with an Express backend. Replaces an entire business team with AI employees — Sales (Aria), Support (Marcus), Marketing (Lexi), Finance (Felix), and Operations (Nova).

## Stack
- **Frontend**: React 18 + TypeScript + Vite on port 5000
- **Backend**: Express.js on port 3001, proxied via Vite `/api → localhost:3001`
- **AI**: Anthropic Claude Sonnet 4.5 via secure server-side proxy at `POST /api/ai`
- **Styling**: Inline CSS with design tokens in `src/design.ts`

## Architecture
```
src/
  main.tsx          — entry point
  App.tsx           — landing ↔ app router
  design.ts         — design tokens (colors, agents)
  utils/ai.ts       — callAI() and callAIWithHistory() helpers
  components/ui.tsx — shared components (Pill, Card, Btn, Badge, Spin, etc.)
  pages/
    Landing.tsx     — full marketing site with auth modal
  app/
    AppShell.tsx    — sidebar + layout + all route rendering
    Dashboard.tsx   — live pulse, KPIs, approvals, agent perf
    CommandCenter.tsx — AI goal → multi-agent execution plan
    CompanyBrain.tsx  — RAG knowledge base for all agents
    SalesHub.tsx    — Aria: pipeline, leads, outreach, proposals
    MarketingHub.tsx— Lexi: campaigns, content generator, SEO
    SupportHub.tsx  — Marcus: tickets, live chat, knowledge base
    FinanceHub.tsx  — Felix: MRR, expenses, forecasts, AI Q&A
    OperationsHub.tsx — Nova: workflows, automation rules
    Marketplace.tsx — Agent marketplace (9+ specialized agents)
    Integrations.tsx— 14 integrations (Gmail, Stripe, Slack, etc.)
    Notifications.tsx — Agent activity feed + approval actions
    Billing.tsx     — Plans, usage, invoices
    Developer.tsx   — API keys, endpoints, webhooks
    Settings.tsx    — Company profile, agent autonomy, team
server.js           — Express API proxy (POST /api/ai → Anthropic)
```

## Running
```bash
npm run dev   # starts both Express (3001) and Vite (5000) concurrently
```

## Required Secrets
- `ANTHROPIC_API_KEY` — Add in Replit Secrets. Without it, AI features show a helpful error message but the UI remains fully functional.

## User Preferences
- Dark theme only
- All AI calls go through the secure backend proxy — never expose the API key to the frontend
