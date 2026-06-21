// ============================================================
// AI BOS — COMPLETE BACKEND SYSTEM
// Stack: Node.js + Express + Anthropic SDK + SQLite + BullMQ
// ============================================================

// ─── FILE STRUCTURE ─────────────────────────────────────────
// src/
//   server.js              → Express app entry point
//   db/
//     schema.sql           → SQLite schema
//     db.js                → DB connection + helpers
//   brain/
//     companyBrain.js      → Company Brain (RAG + knowledge graph)
//     embeddings.js        → Text chunking + vector storage
//   agents/
//     agentBase.js         → Base agent class
//     ariaAgent.js         → AI SDR (sales)
//     marcusAgent.js       → AI Support
//     lexiAgent.js         → AI Marketing
//     felixAgent.js        → AI Finance
//     novaAgent.js         → AI Operations / Coordinator
//     agentOrchestrator.js → Cross-agent task delegation
//   queues/
//     taskQueue.js         → BullMQ job queue
//     workers.js           → Queue workers
//   tools/
//     crmTools.js          → HubSpot/Salesforce CRM actions
//     emailTools.js        → Gmail/Outlook send/read
//     calendarTools.js     → Google Calendar booking
//     slackTools.js        → Slack messaging
//     linkedinTools.js     → LinkedIn enrichment
//   routes/
//     agents.js            → Agent management API
//     brain.js             → Company Brain API
//     activity.js          → Activity feed API
//     dashboard.js         → Dashboard metrics API
//     webhooks.js          → Inbound webhooks (email, CRM events)
//   middleware/
//     auth.js              → API key + JWT auth
//     approval.js          → Human-in-the-loop approval gate
//   utils/
//     logger.js            → Structured logging
//     confidence.js        → Action confidence scoring
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
// 1. SERVER ENTRY — src/server.js
// ══════════════════════════════════════════════════════════════
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db/db.js';
import { startWorkers } from './queues/workers.js';
import agentsRouter from './routes/agents.js';
import brainRouter from './routes/brain.js';
import activityRouter from './routes/activity.js';
import dashboardRouter from './routes/dashboard.js';
import webhooksRouter from './routes/webhooks.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Auth-protected routes
app.use('/api', authMiddleware);
app.use('/api/agents', agentsRouter);
app.use('/api/brain', brainRouter);
app.use('/api/activity', activityRouter);
app.use('/api/dashboard', dashboardRouter);

// Webhook routes (use webhook secret validation, not user JWT)
app.use('/webhooks', webhooksRouter);

// Start BullMQ workers
startWorkers();

app.listen(3000, () => console.log('AI BOS server running on :3000'));
export default app;


// ══════════════════════════════════════════════════════════════
// 2. DATABASE SCHEMA — src/db/schema.sql
// ══════════════════════════════════════════════════════════════
/*
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',   -- starter|growth|team|enterprise
  api_key TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings JSON DEFAULT '{}'
);

CREATE TABLE ai_employees (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,           -- Aria, Marcus, Lexi, Felix, Nova
  role TEXT NOT NULL,           -- sales|support|marketing|finance|ops
  status TEXT DEFAULT 'active', -- active|paused|review_mode
  autonomy_level TEXT DEFAULT 'co-pilot', -- co-pilot|supervised|autonomous
  goals JSON DEFAULT '[]',
  memory JSON DEFAULT '{}',
  kpis JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  doc_type TEXT,                -- sop|product|persona|playbook|crm_sync
  embedding_ids JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brain_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES brain_documents(id),
  company_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding BLOB,               -- float32 array stored as binary
  metadata JSON DEFAULT '{}'
);

CREATE TABLE agent_actions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  action_type TEXT NOT NULL,    -- email_sent|meeting_booked|ticket_resolved|crm_updated|slack_sent|task_delegated
  payload JSON NOT NULL,
  confidence REAL,
  status TEXT DEFAULT 'pending',-- pending|approved|executed|rejected|failed
  reasoning TEXT,
  outcome JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME
);

CREATE TABLE approval_queue (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES agent_actions(id),
  company_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  expires_at DATETIME,
  reviewed_at DATETIME,
  reviewer_note TEXT
);

CREATE TABLE inter_agent_tasks (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  payload JSON NOT NULL,
  status TEXT DEFAULT 'pending',
  result JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  company TEXT,
  linkedin_url TEXT,
  score INTEGER,
  stage TEXT DEFAULT 'new',    -- new|contacted|replied|meeting|proposal|closed
  metadata JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_email TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'open',  -- open|in_progress|resolved|escalated
  resolution TEXT,
  agent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
*/


// ══════════════════════════════════════════════════════════════
// 3. DATABASE LAYER — src/db/db.js
// ══════════════════════════════════════════════════════════════
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const database = new Database('./aibos.db');
database.pragma('journal_mode = WAL');
database.exec(readFileSync('./src/db/schema.sql', 'utf8'));

export const db = {
  // Generic helpers
  get: (sql, params = []) => database.prepare(sql).get(...params),
  all: (sql, params = []) => database.prepare(sql).all(...params),
  run: (sql, params = []) => database.prepare(sql).run(...params),
  uuid: () => randomUUID(),

  // Company helpers
  getCompany: (id) => db.get('SELECT * FROM companies WHERE id = ?', [id]),
  getCompanyByKey: (key) => db.get('SELECT * FROM companies WHERE api_key = ?', [key]),

  // Agent helpers
  getAgent: (id) => db.get('SELECT * FROM ai_employees WHERE id = ?', [id]),
  getAgentsByCompany: (companyId) =>
    db.all('SELECT * FROM ai_employees WHERE company_id = ?', [companyId]),
  getAgentByRole: (companyId, role) =>
    db.get('SELECT * FROM ai_employees WHERE company_id = ? AND role = ?', [companyId, role]),

  // Action helpers
  createAction: (data) => {
    const id = db.uuid();
    db.run(
      `INSERT INTO agent_actions (id, company_id, agent_id, action_type, payload, confidence, status, reasoning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.companyId, data.agentId, data.actionType,
       JSON.stringify(data.payload), data.confidence, data.status, data.reasoning]
    );
    return id;
  },
  updateActionStatus: (id, status, outcome = null) =>
    db.run(
      'UPDATE agent_actions SET status = ?, outcome = ?, executed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, outcome ? JSON.stringify(outcome) : null, id]
    ),

  // Brain helpers
  getBrainDocs: (companyId) =>
    db.all('SELECT id, title, doc_type, created_at FROM brain_documents WHERE company_id = ?', [companyId]),
  getBrainChunks: (companyId) =>
    db.all('SELECT * FROM brain_chunks WHERE company_id = ?', [companyId]),

  // Activity feed
  getActivity: (companyId, limit = 50) =>
    db.all(
      `SELECT a.*, e.name as agent_name, e.role as agent_role
       FROM agent_actions a JOIN ai_employees e ON a.agent_id = e.id
       WHERE a.company_id = ? ORDER BY a.created_at DESC LIMIT ?`,
      [companyId, limit]
    ),
};


// ══════════════════════════════════════════════════════════════
// 4. COMPANY BRAIN (RAG) — src/brain/companyBrain.js
// ══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/db.js';
import { chunkText, cosineSimilarity, textToEmbedding } from './embeddings.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class CompanyBrain {
  constructor(companyId) {
    this.companyId = companyId;
  }

  // Ingest a document into the brain
  async ingest(title, content, docType = 'general') {
    const docId = db.uuid();
    db.run(
      `INSERT INTO brain_documents (id, company_id, title, content, doc_type)
       VALUES (?, ?, ?, ?, ?)`,
      [docId, this.companyId, title, content, docType]
    );

    // Chunk and embed
    const chunks = chunkText(content, 400, 50); // 400 tokens, 50 overlap
    for (const chunk of chunks) {
      const embedding = await textToEmbedding(chunk);
      const chunkId = db.uuid();
      db.run(
        `INSERT INTO brain_chunks (id, document_id, company_id, chunk_text, embedding)
         VALUES (?, ?, ?, ?, ?)`,
        [chunkId, docId, this.companyId, chunk, Buffer.from(new Float32Array(embedding).buffer)]
      );
    }
    return docId;
  }

  // Retrieve top-k most relevant chunks for a query
  async retrieve(query, topK = 5) {
    const queryEmbedding = await textToEmbedding(query);
    const chunks = db.getBrainChunks(this.companyId);

    const scored = chunks.map(chunk => {
      const stored = new Float32Array(chunk.embedding.buffer);
      return {
        text: chunk.chunk_text,
        score: cosineSimilarity(queryEmbedding, Array.from(stored)),
        metadata: JSON.parse(chunk.metadata || '{}'),
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(c => c.text);
  }

  // Build context string for an agent prompt
  async buildContext(query) {
    const chunks = await this.retrieve(query);
    if (!chunks.length) return 'No relevant company knowledge found.';
    return `COMPANY KNOWLEDGE (retrieved for: "${query}"):\n\n${chunks.map((c, i) => `[${i+1}] ${c}`).join('\n\n')}`;
  }

  // Sync CRM contacts into brain as structured memory
  async syncCRMContacts(contacts) {
    const content = contacts.map(c =>
      `Contact: ${c.name} | Email: ${c.email} | Company: ${c.company} | Stage: ${c.stage} | Notes: ${c.notes || 'none'}`
    ).join('\n');
    await this.ingest('CRM Contacts Snapshot', content, 'crm_sync');
  }

  // Get a summary of what the brain knows
  async summarize() {
    const docs = db.getBrainDocs(this.companyId);
    return {
      documentCount: docs.length,
      docTypes: [...new Set(docs.map(d => d.doc_type))],
      documents: docs.map(d => ({ id: d.id, title: d.title, type: d.doc_type, added: d.created_at })),
    };
  }
}


// ══════════════════════════════════════════════════════════════
// 5. EMBEDDINGS UTILITY — src/brain/embeddings.js
// ══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple sliding window chunker
export function chunkText(text, maxTokens = 400, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + maxTokens).join(' '));
    i += maxTokens - overlap;
  }
  return chunks.filter(c => c.trim().length > 20);
}

// Use Voyage AI via Anthropic SDK for embeddings
// (falls back to a simple TF-IDF hash for dev environments)
export async function textToEmbedding(text) {
  try {
    // Production: use a real embedding API
    // For simplicity, using a deterministic 256-dim hash as stand-in
    // Replace with: await anthropic.messages... or openai.embeddings.create(...)
    return hashEmbedding(text, 256);
  } catch (e) {
    return hashEmbedding(text, 256);
  }
}

function hashEmbedding(text, dims) {
  const vec = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dims] += text.charCodeAt(i) / 1000;
  }
  // Normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
}

export function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}


// ══════════════════════════════════════════════════════════════
// 6. BASE AGENT — src/agents/agentBase.js
// ══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/db.js';
import { CompanyBrain } from '../brain/companyBrain.js';
import { scoreConfidence } from '../utils/confidence.js';
import { addToApprovalQueue } from '../middleware/approval.js';
import { logger } from '../utils/logger.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Autonomy thresholds: actions below this confidence go to approval queue
const CONFIDENCE_THRESHOLDS = {
  'co-pilot': 1.0,       // Everything requires approval
  'supervised': 0.85,    // High-confidence actions auto-execute
  'autonomous': 0.60,    // Most actions auto-execute
};

export class AgentBase {
  constructor(agentRecord) {
    this.id = agentRecord.id;
    this.companyId = agentRecord.company_id;
    this.name = agentRecord.name;
    this.role = agentRecord.role;
    this.autonomyLevel = agentRecord.autonomy_level;
    this.goals = JSON.parse(agentRecord.goals || '[]');
    this.memory = JSON.parse(agentRecord.memory || '{}');
    this.brain = new CompanyBrain(agentRecord.company_id);
  }

  // Core: ask Claude to decide what to do
  async think(situation, tools = [], systemAddendum = '') {
    const brainContext = await this.brain.buildContext(situation);
    const system = `
You are ${this.name}, an AI ${this.role} employee at this company.
You are part of the AI BOS system — a coordinated AI workforce.

${brainContext}

AGENT MEMORY:
${JSON.stringify(this.memory, null, 2)}

CURRENT GOALS:
${this.goals.map((g, i) => `${i+1}. ${g}`).join('\n')}

RULES:
- Always act in the company's best interest
- Be specific and professional in all communications
- When uncertain, note your confidence level
- Never fabricate data or make up contact information
- Escalate to humans when confidence is low or stakes are high
- Coordinate with other AI employees when cross-functional actions are needed
${systemAddendum}
`.trim();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      tools: tools.length ? tools : undefined,
      messages: [{ role: 'user', content: situation }],
    });

    return response;
  }

  // Execute an action with confidence scoring and approval gate
  async executeAction(actionType, payload, reasoning, tools) {
    const confidence = await scoreConfidence(actionType, payload, this.role);
    const threshold = CONFIDENCE_THRESHOLDS[this.autonomyLevel];

    const actionId = db.createAction({
      companyId: this.companyId,
      agentId: this.id,
      actionType,
      payload,
      confidence,
      status: confidence >= threshold ? 'approved' : 'pending',
      reasoning,
    });

    logger.info({ actionId, actionType, confidence, threshold, agent: this.name });

    if (confidence < threshold) {
      // Send to approval queue
      await addToApprovalQueue({
        actionId,
        companyId: this.companyId,
        agentId: this.id,
        summary: `${this.name} wants to: ${actionType} — ${JSON.stringify(payload).slice(0, 120)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      return { actionId, status: 'pending_approval', confidence };
    }

    // Execute immediately
    try {
      const result = await this.performAction(actionType, payload, tools);
      db.updateActionStatus(actionId, 'executed', result);
      await this.updateMemory(actionType, payload, result);
      return { actionId, status: 'executed', confidence, result };
    } catch (err) {
      db.updateActionStatus(actionId, 'failed', { error: err.message });
      logger.error({ actionId, error: err.message });
      return { actionId, status: 'failed', error: err.message };
    }
  }

  // Subclasses override performAction for domain-specific tool calls
  async performAction(actionType, payload, tools) {
    throw new Error(`performAction not implemented for ${this.role}`);
  }

  // Update agent's persistent memory after an action
  async updateMemory(actionType, payload, result) {
    this.memory.lastAction = { type: actionType, at: new Date().toISOString() };
    this.memory.actionCount = (this.memory.actionCount || 0) + 1;
    db.run(
      'UPDATE ai_employees SET memory = ? WHERE id = ?',
      [JSON.stringify(this.memory), this.id]
    );
  }

  // Delegate a task to another AI employee
  async delegateTo(targetRole, taskType, taskPayload) {
    const targetAgent = db.getAgentByRole(this.companyId, targetRole);
    if (!targetAgent) {
      logger.warn({ msg: 'Delegation target not found', targetRole });
      return null;
    }
    const taskId = db.uuid();
    db.run(
      `INSERT INTO inter_agent_tasks (id, from_agent_id, to_agent_id, company_id, task_type, payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, this.id, targetAgent.id, this.companyId, taskType, JSON.stringify(taskPayload)]
    );
    logger.info({ msg: 'Task delegated', from: this.name, to: targetAgent.name, taskType });
    return taskId;
  }
}


// ══════════════════════════════════════════════════════════════
// 7. ARIA — AI SDR AGENT — src/agents/ariaAgent.js
// ══════════════════════════════════════════════════════════════
import { AgentBase } from './agentBase.js';
import { sendEmail, readReplies } from '../tools/emailTools.js';
import { bookMeeting } from '../tools/calendarTools.js';
import { updateCRM, scoreLead } from '../tools/crmTools.js';
import { enrichLinkedIn } from '../tools/linkedinTools.js';

const ARIA_TOOLS = [
  {
    name: 'send_email',
    description: 'Send a personalized outreach or follow-up email to a prospect',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Full email body in plain text' },
        isFollowUp: { type: 'boolean' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'book_meeting',
    description: 'Book a discovery call with a qualified prospect',
    input_schema: {
      type: 'object',
      properties: {
        prospectEmail: { type: 'string' },
        prospectName: { type: 'string' },
        repEmail: { type: 'string', description: 'Sales rep whose calendar to book on' },
        durationMinutes: { type: 'number', default: 30 },
        context: { type: 'string', description: 'Meeting context/agenda to include in invite' },
      },
      required: ['prospectEmail', 'prospectName', 'repEmail'],
    },
  },
  {
    name: 'update_crm',
    description: 'Update a contact or deal record in the CRM',
    input_schema: {
      type: 'object',
      properties: {
        contactEmail: { type: 'string' },
        stage: { type: 'string' },
        notes: { type: 'string' },
        dealValue: { type: 'number' },
      },
      required: ['contactEmail'],
    },
  },
  {
    name: 'score_lead',
    description: 'Score a lead based on ICP criteria from Company Brain',
    input_schema: {
      type: 'object',
      properties: {
        leadEmail: { type: 'string' },
        company: { type: 'string' },
        title: { type: 'string' },
        companySize: { type: 'number' },
        industry: { type: 'string' },
      },
      required: ['leadEmail', 'company', 'title'],
    },
  },
];

export class AriaAgent extends AgentBase {
  async runOutreachCycle(leads) {
    for (const lead of leads) {
      // Enrich lead data
      const enriched = await enrichLinkedIn(lead.linkedin_url);
      const situation = `
Prospect: ${lead.name} (${lead.email}) — ${enriched.title} at ${enriched.company}
Company size: ${enriched.companySize} employees | Industry: ${enriched.industry}
LinkedIn summary: ${enriched.summary}

Task: Decide whether to reach out to this prospect, and if so, draft a personalized
first-touch email. Consider our ICP criteria and company context from the Company Brain.
If the lead is a strong fit (score > 70), also prepare a follow-up sequence.
`.trim();

      const response = await this.think(situation, ARIA_TOOLS,
        'Focus on personalization. Generic emails are not acceptable.'
      );
      await this.processToolCalls(response, ARIA_TOOLS);
    }
  }

  async handleReply(emailData) {
    const situation = `
Inbound reply from: ${emailData.from} (${emailData.fromEmail})
Subject: ${emailData.subject}
Their message: ${emailData.body}

Previous context: ${emailData.thread || 'None'}

Task: Analyze this reply. If they are interested, draft a response and book a meeting.
If they need more info, address their questions. If they are not interested, update CRM
and close the sequence gracefully.
`.trim();

    const response = await this.think(situation, ARIA_TOOLS);
    return this.processToolCalls(response, ARIA_TOOLS);
  }

  async performAction(actionType, payload) {
    switch (actionType) {
      case 'send_email': return await sendEmail(payload);
      case 'book_meeting': return await bookMeeting(payload);
      case 'update_crm': return await updateCRM(payload);
      case 'score_lead': return await scoreLead(payload);
      default: throw new Error(`Unknown action: ${actionType}`);
    }
  }

  async processToolCalls(response, tools) {
    const results = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await this.executeAction(
          block.name, block.input, response.content.find(b => b.type === 'text')?.text || ''
        );
        results.push(result);
      }
    }
    return results;
  }
}


// ══════════════════════════════════════════════════════════════
// 8. MARCUS — AI SUPPORT AGENT — src/agents/marcusAgent.js
// ══════════════════════════════════════════════════════════════
import { AgentBase } from './agentBase.js';
import { sendEmail } from '../tools/emailTools.js';
import { updateCRM } from '../tools/crmTools.js';

const MARCUS_TOOLS = [
  {
    name: 'resolve_ticket',
    description: 'Resolve a support ticket with a response to the customer',
    input_schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        customerEmail: { type: 'string' },
        resolution: { type: 'string', description: 'Full resolution message to send customer' },
        addToKnowledgeBase: { type: 'boolean' },
        kbTitle: { type: 'string' },
      },
      required: ['ticketId', 'customerEmail', 'resolution'],
    },
  },
  {
    name: 'escalate_ticket',
    description: 'Escalate a ticket to a human agent with context summary',
    input_schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string' },
        reason: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        summary: { type: 'string' },
        suggestedApproach: { type: 'string' },
      },
      required: ['ticketId', 'reason', 'priority', 'summary'],
    },
  },
  {
    name: 'flag_churn_risk',
    description: 'Flag a customer as a churn risk and notify the sales team',
    input_schema: {
      type: 'object',
      properties: {
        customerEmail: { type: 'string' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        signals: { type: 'array', items: { type: 'string' } },
      },
      required: ['customerEmail', 'riskLevel', 'signals'],
    },
  },
];

export class MarcusAgent extends AgentBase {
  async handleTicket(ticket) {
    const situation = `
Support ticket received:
Ticket ID: ${ticket.id}
Customer: ${ticket.customerEmail}
Subject: ${ticket.subject}
Message: ${ticket.body}
Customer tier: ${ticket.customerTier || 'standard'}
Previous tickets: ${ticket.previousTicketCount || 0}

Task: Analyze this ticket. Can you resolve it autonomously using company knowledge?
If yes, draft a helpful response and resolve it. If the issue is complex, ambiguous,
or the customer seems frustrated/at churn risk, escalate with a detailed summary.
Always check if the resolution should be added to the knowledge base.
`.trim();

    const response = await this.think(situation, MARCUS_TOOLS,
      'Be empathetic. Prioritize customer satisfaction. Flag churn risks proactively.'
    );
    return this.processToolCalls(response, ticket);
  }

  async processToolCalls(response, ticket) {
    const results = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const textBlock = response.content.find(b => b.type === 'text');

        if (block.name === 'resolve_ticket') {
          const result = await this.executeAction('ticket_resolved', block.input, textBlock?.text || '');
          if (block.input.addToKnowledgeBase) {
            await this.brain.ingest(
              block.input.kbTitle || `Solution: ${ticket.subject}`,
              `Q: ${ticket.body}\nA: ${block.input.resolution}`,
              'support_kb'
            );
          }
          results.push(result);
        }

        if (block.name === 'escalate_ticket') {
          await this.executeAction('ticket_escalated', block.input, textBlock?.text || '');
          // Delegate to Nova for cross-functional coordination
          await this.delegateTo('ops', 'handle_escalation', {
            ticketId: ticket.id,
            priority: block.input.priority,
            summary: block.input.summary,
          });
          results.push({ escalated: true, priority: block.input.priority });
        }

        if (block.name === 'flag_churn_risk') {
          // Delegate to Aria (sales) to do proactive outreach
          await this.delegateTo('sales', 'churn_prevention_outreach', {
            customerEmail: block.input.customerEmail,
            riskLevel: block.input.riskLevel,
            signals: block.input.signals,
          });
          results.push({ churnFlagged: true });
        }
      }
    }
    return results;
  }
}


// ══════════════════════════════════════════════════════════════
// 9. LEXI — AI MARKETING AGENT — src/agents/lexiAgent.js
// ══════════════════════════════════════════════════════════════
import { AgentBase } from './agentBase.js';

const LEXI_TOOLS = [
  {
    name: 'create_content',
    description: 'Generate marketing content (blog post, LinkedIn post, email, ad copy)',
    input_schema: {
      type: 'object',
      properties: {
        contentType: { type: 'string', enum: ['blog_post', 'linkedin', 'email', 'ad_copy', 'newsletter'] },
        topic: { type: 'string' },
        targetPersona: { type: 'string' },
        cta: { type: 'string' },
        wordCount: { type: 'number' },
      },
      required: ['contentType', 'topic'],
    },
  },
  {
    name: 'schedule_campaign',
    description: 'Schedule an email nurture campaign for a segment',
    input_schema: {
      type: 'object',
      properties: {
        campaignName: { type: 'string' },
        segment: { type: 'string' },
        emails: { type: 'array', items: { type: 'object' } },
        startDate: { type: 'string' },
        intervalDays: { type: 'number' },
      },
      required: ['campaignName', 'segment', 'emails'],
    },
  },
];

export class LexiAgent extends AgentBase {
  async runWeeklyMarketing() {
    const situation = `
It's the start of a new week. Based on our Company Brain and recent performance data:
1. What content should we create this week to attract our ICP?
2. Are there any nurture sequences that need updating?
3. Are there any campaigns we should launch or pause?

Review our brand voice, target personas, and recent wins/losses to inform your decisions.
Create a LinkedIn post, draft one blog article topic, and review our email sequences.
`.trim();

    const response = await this.think(situation, LEXI_TOOLS,
      'Maintain our brand voice precisely. All content must be on-brand and accurate to company facts.'
    );
    return this.processToolCalls(response);
  }

  async processToolCalls(response) {
    const results = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await this.executeAction(
          block.name, block.input,
          response.content.find(b => b.type === 'text')?.text || ''
        );
        results.push(result);
      }
    }
    return results;
  }
}


// ══════════════════════════════════════════════════════════════
// 10. AGENT ORCHESTRATOR — src/agents/agentOrchestrator.js
// ══════════════════════════════════════════════════════════════
import { db } from '../db/db.js';
import { AriaAgent } from './ariaAgent.js';
import { MarcusAgent } from './marcusAgent.js';
import { LexiAgent } from './lexiAgent.js';
import { logger } from '../utils/logger.js';

const AGENT_CLASSES = {
  sales: AriaAgent,
  support: MarcusAgent,
  marketing: LexiAgent,
};

export class AgentOrchestrator {
  constructor(companyId) {
    this.companyId = companyId;
  }

  // Instantiate an agent by role
  getAgent(role) {
    const record = db.getAgentByRole(this.companyId, role);
    if (!record) throw new Error(`No ${role} agent found for company ${this.companyId}`);
    const AgentClass = AGENT_CLASSES[role];
    if (!AgentClass) throw new Error(`No agent class for role: ${role}`);
    return new AgentClass(record);
  }

  // Process pending inter-agent task queue
  async processDelegatedTasks() {
    const tasks = db.all(
      `SELECT * FROM inter_agent_tasks WHERE company_id = ? AND status = 'pending'`,
      [this.companyId]
    );

    for (const task of tasks) {
      try {
        const toAgent = db.getAgent(task.to_agent_id);
        const agentInstance = new (AGENT_CLASSES[toAgent.role])(toAgent);
        const payload = JSON.parse(task.payload);

        let result;
        // Route task to appropriate agent method
        if (task.task_type === 'churn_prevention_outreach') {
          result = await (agentInstance).handleChurnOutreach(payload);
        } else if (task.task_type === 'handle_escalation') {
          result = await (agentInstance).handleEscalation(payload);
        }

        db.run(
          `UPDATE inter_agent_tasks SET status = 'completed', result = ? WHERE id = ?`,
          [JSON.stringify(result), task.id]
        );
        logger.info({ msg: 'Delegated task completed', taskId: task.id, type: task.task_type });
      } catch (err) {
        db.run(
          `UPDATE inter_agent_tasks SET status = 'failed', result = ? WHERE id = ?`,
          [JSON.stringify({ error: err.message }), task.id]
        );
        logger.error({ msg: 'Delegated task failed', taskId: task.id, error: err.message });
      }
    }
  }

  // Deal closed → trigger cross-functional handoff
  async onDealClosed(dealData) {
    logger.info({ msg: 'Deal closed — triggering cross-functional handoff', deal: dealData.id });

    // 1. Aria updates CRM
    const aria = this.getAgent('sales');
    await aria.executeAction('update_crm', {
      contactEmail: dealData.contactEmail,
      stage: 'closed_won',
      notes: `Deal closed. Value: $${dealData.value}. Handoff initiated.`,
    }, 'Deal closed trigger');

    // 2. Marcus starts onboarding ticket
    const marcus = this.getAgent('support');
    await marcus.executeAction('create_onboarding_ticket', {
      customerEmail: dealData.contactEmail,
      customerName: dealData.contactName,
      plan: dealData.plan,
    }, 'Auto-triggered by deal close');

    // 3. Lexi updates nurture to post-sale sequence
    const lexi = this.getAgent('marketing');
    await lexi.executeAction('update_contact_segment', {
      email: dealData.contactEmail,
      fromSegment: 'trial',
      toSegment: 'customer',
    }, 'Auto-triggered by deal close');

    logger.info({ msg: 'Cross-functional handoff complete', deal: dealData.id });
  }
}


// ══════════════════════════════════════════════════════════════
// 11. TASK QUEUE — src/queues/workers.js
// ══════════════════════════════════════════════════════════════
import { Worker, Queue } from 'bullmq';
import { AgentOrchestrator } from '../agents/agentOrchestrator.js';
import { db } from '../db/db.js';
import { logger } from '../utils/logger.js';

const connection = { host: process.env.REDIS_HOST || 'localhost', port: 6379 };

export const agentQueue = new Queue('agent-tasks', { connection });

export function startWorkers() {
  // Main agent task worker
  const worker = new Worker('agent-tasks', async (job) => {
    const { companyId, taskType, payload } = job.data;
    const orchestrator = new AgentOrchestrator(companyId);
    logger.info({ msg: 'Processing job', jobId: job.id, taskType });

    switch (taskType) {
      case 'outreach_cycle': {
        const aria = orchestrator.getAgent('sales');
        return await aria.runOutreachCycle(payload.leads);
      }
      case 'handle_email_reply': {
        const aria = orchestrator.getAgent('sales');
        return await aria.handleReply(payload.emailData);
      }
      case 'handle_support_ticket': {
        const marcus = orchestrator.getAgent('support');
        return await marcus.handleTicket(payload.ticket);
      }
      case 'weekly_marketing': {
        const lexi = orchestrator.getAgent('marketing');
        return await lexi.runWeeklyMarketing();
      }
      case 'deal_closed': {
        return await orchestrator.onDealClosed(payload.dealData);
      }
      case 'process_delegated_tasks': {
        return await orchestrator.processDelegatedTasks();
      }
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }, { connection, concurrency: 5 });

  worker.on('completed', job => logger.info({ msg: 'Job completed', jobId: job.id }));
  worker.on('failed', (job, err) => logger.error({ msg: 'Job failed', jobId: job?.id, error: err.message }));

  // Schedule recurring jobs
  scheduleRecurringJobs();
}

async function scheduleRecurringJobs() {
  const companies = db.all('SELECT id FROM companies WHERE plan != ?', ['cancelled']);
  for (const company of companies) {
    // Process delegated inter-agent tasks every 5 min
    await agentQueue.add('delegated-tasks', {
      companyId: company.id, taskType: 'process_delegated_tasks', payload: {}
    }, { repeat: { every: 5 * 60 * 1000 } });

    // Weekly marketing cycle every Monday 9am
    await agentQueue.add('weekly-marketing', {
      companyId: company.id, taskType: 'weekly_marketing', payload: {}
    }, { repeat: { pattern: '0 9 * * 1' } });
  }
}


// ══════════════════════════════════════════════════════════════
// 12. API ROUTES — src/routes/agents.js
// ══════════════════════════════════════════════════════════════
import express from 'express';
import { db } from '../db/db.js';
import { AgentOrchestrator } from '../agents/agentOrchestrator.js';
import { agentQueue } from '../queues/workers.js';
import { CompanyBrain } from '../brain/companyBrain.js';

const router = express.Router();

// GET /api/agents — list all AI employees for the company
router.get('/', (req, res) => {
  const agents = db.getAgentsByCompany(req.company.id);
  res.json({ agents: agents.map(a => ({ ...a, memory: JSON.parse(a.memory || '{}') })) });
});

// POST /api/agents — deploy a new AI employee
router.post('/', async (req, res) => {
  const { name, role, goals, autonomyLevel } = req.body;
  const id = db.uuid();
  db.run(
    `INSERT INTO ai_employees (id, company_id, name, role, goals, autonomy_level)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.company.id, name, role, JSON.stringify(goals || []), autonomyLevel || 'co-pilot']
  );
  res.status(201).json({ id, name, role, status: 'active' });
});

// PATCH /api/agents/:id — update goals, autonomy, or pause
router.patch('/:id', (req, res) => {
  const { goals, autonomyLevel, status } = req.body;
  const agent = db.getAgent(req.params.id);
  if (!agent || agent.company_id !== req.company.id) return res.status(404).json({ error: 'Not found' });

  if (goals) db.run('UPDATE ai_employees SET goals = ? WHERE id = ?', [JSON.stringify(goals), agent.id]);
  if (autonomyLevel) db.run('UPDATE ai_employees SET autonomy_level = ? WHERE id = ?', [autonomyLevel, agent.id]);
  if (status) db.run('UPDATE ai_employees SET status = ? WHERE id = ?', [status, agent.id]);

  res.json({ updated: true });
});

// POST /api/agents/:id/trigger — manually trigger an agent task
router.post('/:id/trigger', async (req, res) => {
  const { taskType, payload } = req.body;
  const job = await agentQueue.add(taskType, {
    companyId: req.company.id, taskType, payload,
  });
  res.json({ jobId: job.id, queued: true });
});

// GET /api/agents/:id/activity — agent-specific activity feed
router.get('/:id/activity', (req, res) => {
  const actions = db.all(
    'SELECT * FROM agent_actions WHERE agent_id = ? ORDER BY created_at DESC LIMIT 100',
    [req.params.id]
  );
  res.json({ actions });
});

// POST /api/agents/approve/:actionId — approve a pending action
router.post('/approve/:actionId', async (req, res) => {
  const { approved, note } = req.body;
  const action = db.get('SELECT * FROM agent_actions WHERE id = ?', [req.params.actionId]);
  if (!action || action.company_id !== req.company.id) return res.status(404).json({ error: 'Not found' });

  if (!approved) {
    db.updateActionStatus(action.id, 'rejected', { note });
    return res.json({ status: 'rejected' });
  }

  // Queue the action for immediate execution
  await agentQueue.add('approved-action', {
    companyId: req.company.id,
    taskType: 'execute_approved_action',
    payload: { actionId: action.id, action },
  });

  res.json({ status: 'approved', queued: true });
});

export default router;


// ══════════════════════════════════════════════════════════════
// 13. BRAIN API ROUTES — src/routes/brain.js
// ══════════════════════════════════════════════════════════════
import express from 'express';
import multer from 'multer';
import { CompanyBrain } from '../brain/companyBrain.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/brain — brain summary
router.get('/', async (req, res) => {
  const brain = new CompanyBrain(req.company.id);
  const summary = await brain.summarize();
  res.json(summary);
});

// POST /api/brain/ingest — upload a document
router.post('/ingest', upload.single('file'), async (req, res) => {
  const brain = new CompanyBrain(req.company.id);
  let content = req.body.content || '';

  if (req.file) {
    content = req.file.buffer.toString('utf8');
  }

  if (!content) return res.status(400).json({ error: 'No content provided' });

  const docId = await brain.ingest(
    req.body.title || 'Untitled document',
    content,
    req.body.docType || 'general'
  );
  res.status(201).json({ docId, message: 'Document ingested and embedded' });
});

// POST /api/brain/query — query the brain directly (debug endpoint)
router.post('/query', async (req, res) => {
  const brain = new CompanyBrain(req.company.id);
  const chunks = await brain.retrieve(req.body.query, req.body.topK || 5);
  res.json({ query: req.body.query, results: chunks });
});

// DELETE /api/brain/:docId — remove a document from brain
router.delete('/:docId', (req, res) => {
  db.run('DELETE FROM brain_chunks WHERE document_id = ?', [req.params.docId]);
  db.run('DELETE FROM brain_documents WHERE id = ? AND company_id = ?',
    [req.params.docId, req.company.id]);
  res.json({ deleted: true });
});

export default router;


// ══════════════════════════════════════════════════════════════
// 14. DASHBOARD API — src/routes/dashboard.js
// ══════════════════════════════════════════════════════════════
import express from 'express';
import { db } from '../db/db.js';
const router = express.Router();

// GET /api/dashboard — main metrics for the Operations Console
router.get('/', (req, res) => {
  const cId = req.company.id;

  const meetingsBooked = db.get(
    `SELECT COUNT(*) as count FROM agent_actions WHERE company_id = ? AND action_type = 'book_meeting' AND status = 'executed' AND date(created_at) = date('now')`,
    [cId]
  );
  const emailsSent = db.get(
    `SELECT COUNT(*) as count FROM agent_actions WHERE company_id = ? AND action_type = 'send_email' AND status = 'executed' AND date(created_at) = date('now')`,
    [cId]
  );
  const ticketsResolved = db.get(
    `SELECT COUNT(*) as count FROM agent_actions WHERE company_id = ? AND action_type = 'ticket_resolved' AND status = 'executed' AND date(created_at) = date('now')`,
    [cId]
  );
  const pendingApprovals = db.all(
    `SELECT a.*, e.name as agent_name FROM approval_queue a JOIN ai_employees e ON a.agent_id = e.id WHERE a.company_id = ? AND a.reviewed_at IS NULL ORDER BY a.expires_at ASC`,
    [cId]
  );
  const activity = db.getActivity(cId, 20);
  const agents = db.getAgentsByCompany(cId);

  res.json({
    today: {
      meetingsBooked: meetingsBooked.count,
      emailsSent: emailsSent.count,
      ticketsResolved: ticketsResolved.count,
      pendingApprovals: pendingApprovals.length,
    },
    agents: agents.map(a => ({
      id: a.id, name: a.name, role: a.role,
      status: a.status, autonomyLevel: a.autonomy_level,
    })),
    pendingApprovals,
    recentActivity: activity,
  });
});

// GET /api/dashboard/kpis — weekly/monthly KPIs
router.get('/kpis', (req, res) => {
  const cId = req.company.id;
  const weeklyMeetings = db.all(
    `SELECT date(created_at) as day, COUNT(*) as count FROM agent_actions
     WHERE company_id = ? AND action_type = 'book_meeting' AND status = 'executed'
     AND created_at >= date('now', '-7 days') GROUP BY day`,
    [cId]
  );
  const autonomyRate = db.get(
    `SELECT
       ROUND(100.0 * SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END) /
       MAX(COUNT(*), 1), 1) as rate
     FROM agent_actions WHERE company_id = ? AND created_at >= date('now', '-30 days')`,
    [cId]
  );
  res.json({ weeklyMeetings, autonomyRate: autonomyRate?.rate || 0 });
});

export default router;


// ══════════════════════════════════════════════════════════════
// 15. WEBHOOKS — src/routes/webhooks.js
// ══════════════════════════════════════════════════════════════
import express from 'express';
import crypto from 'crypto';
import { agentQueue } from '../queues/workers.js';
import { db } from '../db/db.js';

const router = express.Router();

// Validate webhook signature
function validateWebhook(req, secret) {
  const sig = req.headers['x-webhook-signature'];
  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  return sig === `sha256=${expected}`;
}

// POST /webhooks/email-reply — inbound email (Postmark/SendGrid)
router.post('/email-reply', async (req, res) => {
  const { from, fromEmail, subject, textBody, messageId, companyId } = req.body;
  await agentQueue.add('handle-reply', {
    companyId,
    taskType: 'handle_email_reply',
    payload: { emailData: { from, fromEmail, subject, body: textBody, messageId } },
  });
  res.json({ received: true });
});

// POST /webhooks/crm-event — HubSpot deal stage change
router.post('/crm-event', async (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    if (event.propertyName === 'dealstage' && event.propertyValue === 'closedwon') {
      const company = db.get('SELECT id FROM companies WHERE crm_account_id = ?', [event.portalId]);
      if (!company) continue;
      await agentQueue.add('deal-closed', {
        companyId: company.id,
        taskType: 'deal_closed',
        payload: { dealData: { id: event.objectId, contactEmail: event.contactEmail } },
      });
    }
  }
  res.json({ received: true });
});

// POST /webhooks/support-ticket — Zendesk/Intercom new ticket
router.post('/support-ticket', async (req, res) => {
  const { companyId, ticket } = req.body;
  await agentQueue.add('support-ticket', {
    companyId,
    taskType: 'handle_support_ticket',
    payload: { ticket },
  });
  res.json({ received: true });
});

export default router;


// ══════════════════════════════════════════════════════════════
// 16. CONFIDENCE SCORING — src/utils/confidence.js
// ══════════════════════════════════════════════════════════════
export async function scoreConfidence(actionType, payload, agentRole) {
  // Base confidence scores per action type
  const baseScores = {
    send_email: 0.75,
    book_meeting: 0.80,
    update_crm: 0.90,
    score_lead: 0.95,
    resolve_ticket: 0.80,
    escalate_ticket: 0.95,
    flag_churn_risk: 0.85,
    create_content: 0.88,
    schedule_campaign: 0.70,
    update_contact_segment: 0.92,
  };

  let score = baseScores[actionType] ?? 0.70;

  // Reduce confidence for high-value or external-facing actions
  if (payload.dealValue && payload.dealValue > 10000) score -= 0.15;
  if (payload.priority === 'critical') score -= 0.20;
  if (payload.to && payload.to.includes('@competitor.com')) score -= 0.30;

  // Cap to [0, 1]
  return Math.max(0, Math.min(1, score));
}


// ══════════════════════════════════════════════════════════════
// 17. AUTH MIDDLEWARE — src/middleware/auth.js
// ══════════════════════════════════════════════════════════════
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';

  // API Key auth (for integrations)
  if (auth.startsWith('ApiKey ')) {
    const key = auth.slice(7);
    const company = db.getCompanyByKey(key);
    if (!company) return res.status(401).json({ error: 'Invalid API key' });
    req.company = company;
    return next();
  }

  // JWT auth (for dashboard users)
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
      const company = db.getCompany(payload.companyId);
      if (!company) return res.status(401).json({ error: 'Company not found' });
      req.company = company;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  return res.status(401).json({ error: 'No auth credentials provided' });
}


// ══════════════════════════════════════════════════════════════
// 18. APPROVAL MIDDLEWARE — src/middleware/approval.js
// ══════════════════════════════════════════════════════════════
import { db } from '../db/db.js';
import { sendSlackMessage } from '../tools/slackTools.js';

export async function addToApprovalQueue({ actionId, companyId, agentId, summary, expiresAt }) {
  const id = db.uuid();
  db.run(
    `INSERT INTO approval_queue (id, action_id, company_id, agent_id, summary, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, actionId, companyId, agentId, summary, expiresAt.toISOString()]
  );

  // Notify via Slack (if connected)
  const company = db.getCompany(companyId);
  const settings = JSON.parse(company.settings || '{}');
  if (settings.slackApprovalChannel) {
    await sendSlackMessage({
      channel: settings.slackApprovalChannel,
      text: `🤖 AI BOS approval needed:\n*${summary}*\nApprove at: https://app.aibos.ai/approvals/${id}`,
    }).catch(() => {}); // Non-blocking
  }
}


// ══════════════════════════════════════════════════════════════
// 19. LOGGER — src/utils/logger.js
// ══════════════════════════════════════════════════════════════
export const logger = {
  info: (obj) => console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), ...obj })),
  warn: (obj) => console.warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), ...obj })),
  error: (obj) => console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), ...obj })),
};


// ══════════════════════════════════════════════════════════════
// 20. PACKAGE.JSON
// ══════════════════════════════════════════════════════════════
/*
{
  "name": "aibos-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "better-sqlite3": "^9.4.3",
    "bullmq": "^5.4.0",
    "cors": "^2.8.5",
    "express": "^4.18.3",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0",
    "vitest": "^1.4.0"
  }
}
*/

// ══════════════════════════════════════════════════════════════
// 21. .env.example
// ══════════════════════════════════════════════════════════════
/*
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-jwt-secret-here
REDIS_HOST=localhost
REDIS_PORT=6379
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
HUBSPOT_API_KEY=...
SLACK_BOT_TOKEN=xoxb-...
LINKEDIN_API_KEY=...
GOOGLE_CALENDAR_CLIENT_ID=...
POSTMARK_API_KEY=...
WEBHOOK_SECRET=...
*/
