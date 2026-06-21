import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import brainRouter from './server/brain-routes.js'
import leadsRouter from './server/leads-routes.js';
import collaborationRouter from './server/collaboration-routes.js';
import analyticsRouter from './server/analytics-routes.js';
import billingRouter from './server/billing-routes.js';
import { handleStripeWebhook } from './server/billing-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || (isProd ? 5000 : 3001);

app.use(cors());
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json({ limit: '10mb' }));

if (process.env.CLERK_SECRET_KEY) {
  try {
    const { clerkMiddleware } = await import('@clerk/express');
    app.use(clerkMiddleware({
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY,
    }));
    console.log('Clerk middleware active');
  } catch (e) {
    console.warn('Clerk middleware failed to load:', e.message);
  }
}

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

app.post('/api/ai', async (req, res) => {
  const { system, message, maxTokens = 700, messages } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured. Add it in Secrets.' });
  }

  try {
    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: system || '',
      messages: messages || [{ role: 'user', content: message || '' }]
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.json({ text });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI request failed. Check your API key.' });
  }
});

app.use('/api/brain', brainRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/collaboration', collaborationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/billing', billingRouter);

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('/', (_, res) => res.json({
    status: 'ok',
    service: 'AI BOS API',
    message: 'Frontend build not found. Run npm run build before production start.'
  }));
}

if (!process.env.VERCEL && !process.env.NETLIFY) {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`AI BOS running on port ${PORT} (${isProd ? 'production' : 'development'})`)
  );
}

export default app;
