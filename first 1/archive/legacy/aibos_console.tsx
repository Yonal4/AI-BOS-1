import { useState, useEffect, useRef } from "react";

const AGENTS = [
  { id: "aria",   name: "Aria",   role: "Sales SDR",     emoji: "📊", color: "#7c6dfa", bg: "rgba(124,109,250,0.15)", dept: "sales" },
  { id: "marcus", name: "Marcus", role: "Support",        emoji: "🎧", color: "#22d3b0", bg: "rgba(34,211,176,0.15)",  dept: "support" },
  { id: "lexi",   name: "Lexi",   role: "Marketing",      emoji: "📣", color: "#f06a40", bg: "rgba(240,106,64,0.15)",  dept: "marketing" },
  { id: "felix",  name: "Felix",  role: "Finance",        emoji: "💰", color: "#facc4b", bg: "rgba(250,204,75,0.15)",  dept: "finance" },
  { id: "nova",   name: "Nova",   role: "Operations",     emoji: "⚙️", color: "#63c8c8", bg: "rgba(99,200,200,0.15)", dept: "ops" },
];

const SAMPLE_TASKS = {
  aria:   "A new lead just came in: Jordan Blake, VP of Engineering at TechFlow (80 employees, SaaS, Series A). Draft a personalized outreach email.",
  marcus: "Support ticket: Customer says their AI employee stopped sending emails after the CRM integration. They're frustrated and threatening to cancel.",
  lexi:   "Create a LinkedIn post announcing our new Company Brain feature that shows how AI employees share context across departments.",
  felix:  "Summarize this week's financial performance: $47,200 in new MRR, 3 churns ($2,400), API costs up 18%. What should we flag to leadership?",
  nova:   "A deal just closed with Nexus AI ($1,999/month Team plan). Coordinate the handoff: update CRM, start onboarding, move them off trial nurture sequence.",
};

const SYSTEM_PROMPTS = {
  aria:   "You are Aria, an elite AI Sales Development Representative. You write sharp, highly personalized outreach emails. You know our product is AI BOS — an AI Business Operating System that gives companies a workforce of AI employees sharing a Company Brain. Our ICP: funded startups 5-200 employees, $500K-$20M ARR. Starter plan $299/mo, Growth $799/mo, Team $1,999/mo. Be specific, human, and compelling. Keep emails under 120 words.",
  marcus: "You are Marcus, an expert AI Customer Support specialist. You're empathetic, solution-focused, and proactive about churn prevention. You know AI BOS deeply. When customers are frustrated, you de-escalate first, then solve. Always end with a confidence-restoring statement. Flag churn risks explicitly.",
  lexi:   "You are Lexi, a sharp AI Marketing Manager. You write copy that is direct, bold, and resonates with founders and operators. You know our brand voice: confident, no-nonsense, outcome-focused. Avoid hype words like 'revolutionary' or 'game-changing'. Show don't tell.",
  felix:  "You are Felix, a precise AI Finance Analyst. You surface the key signals in financial data, flag risks, and give clear recommendations. Use numbers. Be concise. Structure your response as: Summary → Key Signals → Risks → Recommendations.",
  nova:   "You are Nova, the AI Operations Lead and cross-functional coordinator. When a deal closes, you orchestrate the handoff across all AI employees. Be specific about which agent does what, in what order, with what data. Output a structured action plan.",
};

function AgentCard({ agent, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, cursor: "pointer", transition: ".15s",
      background: active ? agent.bg : "transparent",
      border: `1px solid ${active ? agent.color + "60" : "rgba(255,255,255,0.06)"}`,
      marginBottom: 6,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: agent.bg,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {agent.emoji}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: active ? agent.color : "#e8e8f0" }}>{agent.name}</div>
        <div style={{ fontSize: 11, color: "#6b6b88" }}>{agent.role}</div>
      </div>
      <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
        background: "#22d3b0", boxShadow: "0 0 6px #22d3b0", flexShrink: 0 }} />
    </div>
  );
}

function ActivityItem({ item }) {
  const agent = AGENTS.find(a => a.id === item.agentId);
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0",
      borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: agent?.bg || "#222",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
        {agent?.emoji}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#c8c8e0", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: agent?.color || "#fff" }}>{agent?.name}</span>
          {" "}{item.action}
        </div>
        <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 2 }}>{item.time}</div>
      </div>
      <div style={{ marginLeft: "auto", flexShrink: 0 }}>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20,
          background: item.status === "executed" ? "rgba(34,211,176,0.15)" : "rgba(124,109,250,0.15)",
          color: item.status === "executed" ? "#22d3b0" : "#a594ff" }}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10,
      border: "0.5px solid rgba(255,255,255,0.07)", padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#6b6b88", marginBottom: 4, letterSpacing: .4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, color: color || "#e8e8f0" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#22d3b0", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function AIBOSConsole() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [task, setTask] = useState(SAMPLE_TASKS.aria);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState([
    { agentId: "aria",   action: "sent follow-up to jordan@techcorp.io — deal moved to Proposal", time: "2 min ago", status: "executed" },
    { agentId: "marcus", action: "resolved 3 tickets autonomously, escalated 1 with summary", time: "8 min ago", status: "executed" },
    { agentId: "lexi",   action: "published LinkedIn post, scheduled Thursday nurture campaign", time: "22 min ago", status: "executed" },
    { agentId: "nova",   action: "coordinated deal close handoff for Nexus AI ($1,999/mo)", time: "1 hr ago", status: "executed" },
    { agentId: "aria",   action: "drafted outreach to 14 new ICP leads from CRM enrichment", time: "2 hr ago", status: "executed" },
  ]);
  const [metrics, setMetrics] = useState({ meetings: 14, emails: 287, tickets: 43, approvals: 2 });
  const [brainDocs, setBrainDocs] = useState([
    { title: "Product Documentation v3", type: "product", chunks: 34 },
    { title: "ICP & Buyer Personas", type: "persona", chunks: 12 },
    { title: "Sales Playbook 2026", type: "playbook", chunks: 28 },
    { title: "Brand Voice Guide", type: "sop", chunks: 9 },
    { title: "CRM Contacts Snapshot", type: "crm_sync", chunks: 156 },
    { title: "Pricing & Objection Handling", type: "playbook", chunks: 18 },
  ]);
  const [view, setView] = useState("console"); // console | brain | activity
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: "a1", agent: "aria", summary: "Send cold email to CEO of Stripe (high-value prospect)", confidence: 0.62 },
    { id: "a2", agent: "lexi", summary: "Launch $2,000 LinkedIn ad campaign for Q3 push", confidence: 0.71 },
  ]);
  const textareaRef = useRef(null);

  const selectAgent = (agent) => {
    setActiveAgent(agent);
    setTask(SAMPLE_TASKS[agent.id]);
    setResponse("");
  };

  const runAgent = async () => {
    if (!task.trim() || loading) return;
    setLoading(true);
    setResponse("");

    const newActivity = {
      agentId: activeAgent.id,
      action: `processing: "${task.slice(0, 60)}..."`,
      time: "just now",
      status: "pending",
    };
    setActivity(prev => [newActivity, ...prev.slice(0, 9)]);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `${SYSTEM_PROMPTS[activeAgent.id]}\n\nCOMPANY BRAIN CONTEXT:\n- Company: AI BOS Inc.\n- Product: AI Business Operating System\n- Plans: Starter $299/mo (1 AI employee), Growth $799/mo (3), Team $1,999/mo (8)\n- ICP: Funded startups, 5-200 employees, SaaS/e-commerce/agencies\n- Current customers: 200+ companies\n- AI Employees: Aria (Sales), Marcus (Support), Lexi (Marketing), Felix (Finance), Nova (Ops)\n- Tone: Confident, direct, outcome-focused, no fluff`,
          messages: [{ role: "user", content: task }],
        }),
      });

      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "No response";
      setResponse(text);

      setActivity(prev => [
        { ...newActivity, action: `completed task — ${task.slice(0, 55)}...`, status: "executed", time: "just now" },
        ...prev.slice(1),
      ]);
      setMetrics(m => ({ ...m, emails: m.emails + (activeAgent.id === "aria" ? 1 : 0) }));
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const approveAction = (id, approved) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setActivity(prev => [{
      agentId: pendingApprovals.find(a => a.id === id)?.agent || "nova",
      action: approved ? "action approved and executed by human reviewer" : "action rejected by human reviewer",
      time: "just now",
      status: approved ? "executed" : "rejected",
    }, ...prev.slice(0, 9)]);
    setMetrics(m => ({ ...m, approvals: Math.max(0, m.approvals - 1) }));
  };

  const s = {
    wrap: { display: "flex", height: "100vh", background: "#0a0a0f", fontFamily: "'Inter', system-ui, sans-serif", color: "#e8e8f0", overflow: "hidden" },
    sidebar: { width: 220, background: "#0d0d14", borderRight: "0.5px solid rgba(255,255,255,0.07)", padding: "0 12px", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "auto" },
    main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    topbar: { height: 52, background: "#0d0d14", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 },
    content: { flex: 1, display: "flex", overflow: "hidden" },
  };

  return (
    <div style={s.wrap}>
      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={{ padding: "16px 4px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "0.5px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#7c6dfa,#22d3b0)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>B</div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>AI BOS</span>
        </div>

        <div style={{ fontSize: 10, color: "#4a4a6a", letterSpacing: 1, textTransform: "uppercase", padding: "0 4px", marginBottom: 8 }}>AI Workforce</div>
        {AGENTS.map(a => <AgentCard key={a.id} agent={a} active={activeAgent.id === a.id && view === "console"} onClick={() => { selectAgent(a); setView("console"); }} />)}

        <div style={{ fontSize: 10, color: "#4a4a6a", letterSpacing: 1, textTransform: "uppercase", padding: "12px 4px 8px", marginTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>System</div>
        {[["brain","🧠","Company Brain"],["activity","📋","Activity Log"]].map(([v, icon, label]) => (
          <div key={v} onClick={() => setView(v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 4,
            background: view === v ? "rgba(124,109,250,0.1)" : "transparent", color: view === v ? "#a594ff" : "#6b6b88", fontSize: 13 }}>
            <span style={{ fontSize: 14 }}>{icon}</span>{label}
          </div>
        ))}

        <div style={{ marginTop: "auto", padding: "12px 4px", borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Brain completeness</div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
            <div style={{ height: "100%", width: "74%", background: "linear-gradient(90deg,#7c6dfa,#22d3b0)", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 10, color: "#6b6b88", marginTop: 4 }}>74% complete</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        {/* TOP BAR */}
        <div style={s.topbar}>
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            {[
              { label: "Meetings today", val: metrics.meetings, color: "#22d3b0" },
              { label: "Emails sent", val: metrics.emails, color: "#a594ff" },
              { label: "Tickets resolved", val: metrics.tickets, color: "#f06a40" },
            ].map(m => (
              <div key={m.label} style={{ fontSize: 12 }}>
                <span style={{ color: "#4a4a6a", marginRight: 6 }}>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color }}>{m.val}</span>
              </div>
            ))}
          </div>
          {pendingApprovals.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(250,204,75,0.12)", border: "0.5px solid rgba(250,204,75,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#facc4b" }}>
              ⏳ {pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div style={s.content}>
          {/* CONSOLE VIEW */}
          {view === "console" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Agent header */}
              <div style={{ padding: "16px 20px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "#0d0d14" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: activeAgent.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{activeAgent.emoji}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: activeAgent.color }}>{activeAgent.name}</div>
                  <div style={{ fontSize: 12, color: "#6b6b88" }}>AI {activeAgent.role} · Always-on · Autonomous</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22d3b0" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3b0", animation: "none" }} /> Active
                </div>
              </div>

              {/* Task input */}
              <div style={{ padding: "16px 20px", background: "#0f0f18", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: .5, textTransform: "uppercase", marginBottom: 8 }}>Task / Situation</div>
                <textarea
                  ref={textareaRef}
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runAgent(); }}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#e0e0f0", fontSize: 13, lineHeight: 1.6, resize: "none", minHeight: 80, outline: "none", fontFamily: "inherit" }}
                  placeholder="Describe a situation for this AI employee to handle..."
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "#3a3a5a" }}>⌘+Enter to run</span>
                  <button onClick={runAgent} disabled={loading} style={{ padding: "9px 22px", background: loading ? "rgba(124,109,250,0.4)" : activeAgent.color, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: ".15s" }}>
                    {loading ? (
                      <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Thinking...</>
                    ) : `Run ${activeAgent.name} →`}
                  </button>
                </div>
              </div>

              {/* Response area */}
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
                {!response && !loading && (
                  <div style={{ color: "#3a3a5a", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{activeAgent.emoji}</div>
                    <div>Run a task to see {activeAgent.name} in action.</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#2a2a48" }}>Company Brain context will be injected automatically.</div>
                  </div>
                )}
                {loading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                    {["Retrieving Company Brain context...", `${activeAgent.name} is analyzing the situation...`, "Drafting response..."].map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: "#5a5a7a", fontSize: 12 }}>
                        <div style={{ width: 14, height: 14, border: "1.5px solid rgba(124,109,250,0.3)", borderTopColor: "#7c6dfa", borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
                        {t}
                      </div>
                    ))}
                  </div>
                )}
                {response && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: `0.5px solid ${activeAgent.color}40`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: activeAgent.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{activeAgent.emoji}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: activeAgent.color }}>{activeAgent.name} — {activeAgent.role}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "#22d3b0", background: "rgba(34,211,176,0.12)", padding: "2px 8px", borderRadius: 20 }}>✓ Executed</span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.75, color: "#d8d8f0", whiteSpace: "pre-wrap" }}>{response}</div>
                    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                      <button style={{ padding: "6px 14px", background: "rgba(34,211,176,0.12)", border: "0.5px solid rgba(34,211,176,0.3)", borderRadius: 6, color: "#22d3b0", fontSize: 12, cursor: "pointer" }}>✓ Approve & Send</button>
                      <button style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#9b9bb8", fontSize: 12, cursor: "pointer" }}>✎ Edit</button>
                      <button onClick={() => setResponse("")} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#9b9bb8", fontSize: 12, cursor: "pointer" }}>✕ Discard</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRAIN VIEW */}
          {view === "brain" && (
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>Company Brain</div>
                  <div style={{ fontSize: 13, color: "#6b6b88", marginTop: 2 }}>Knowledge shared by all AI employees</div>
                </div>
                <button style={{ padding: "8px 16px", background: "#7c6dfa", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Upload Document</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                <MetricCard label="Total documents" value={brainDocs.length} sub="across all types" color="#a594ff" />
                <MetricCard label="Total chunks" value={brainDocs.reduce((s, d) => s + d.chunks, 0)} sub="indexed & embedded" color="#22d3b0" />
                <MetricCard label="Brain health" value="74%" sub="4 fields missing" color="#facc4b" />
              </div>
              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: .5, textTransform: "uppercase", marginBottom: 12 }}>Indexed Documents</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {brainDocs.map((doc, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 20 }}>
                      {{ product: "📦", persona: "👤", playbook: "📖", sop: "⚙️", crm_sync: "🔄", support_kb: "💬" }[doc.type] || "📄"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.title}</div>
                      <div style={{ fontSize: 11, color: "#6b6b88", marginTop: 2 }}>{doc.type} · {doc.chunks} chunks indexed</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(34,211,176,0.1)", color: "#22d3b0" }}>Synced</span>
                    <button style={{ fontSize: 11, color: "#4a4a6a", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, background: "rgba(124,109,250,0.06)", border: "0.5px solid rgba(124,109,250,0.2)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#a594ff" }}>⚠ Missing context (reduces AI quality)</div>
                {["Company pricing objection scripts", "Customer case studies", "Competitive battlecards", "Onboarding SOPs"].map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#6b6b88", display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ color: "#facc4b" }}>!</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY VIEW */}
          {view === "activity" && (
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>Activity Log</div>
              <div style={{ fontSize: 13, color: "#6b6b88", marginBottom: 20 }}>All AI employee actions — real-time</div>

              {pendingApprovals.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "#facc4b", letterSpacing: .5, textTransform: "uppercase", marginBottom: 10 }}>⏳ Pending Approvals</div>
                  {pendingApprovals.map(ap => {
                    const agent = AGENTS.find(a => a.id === ap.agent);
                    return (
                      <div key={ap.id} style={{ background: "rgba(250,204,75,0.06)", border: "0.5px solid rgba(250,204,75,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>{agent?.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{ap.summary}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#6b6b88" }}>Confidence: <span style={{ color: "#facc4b" }}>{Math.round(ap.confidence * 100)}%</span> — below threshold for autonomous execution</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => approveAction(ap.id, false)} style={{ padding: "5px 12px", background: "rgba(255,80,80,0.15)", border: "0.5px solid rgba(255,80,80,0.3)", borderRadius: 6, color: "#ff6b6b", fontSize: 12, cursor: "pointer" }}>Reject</button>
                            <button onClick={() => approveAction(ap.id, true)} style={{ padding: "5px 12px", background: "rgba(34,211,176,0.15)", border: "0.5px solid rgba(34,211,176,0.3)", borderRadius: 6, color: "#22d3b0", fontSize: 12, cursor: "pointer" }}>Approve ✓</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: .5, textTransform: "uppercase", marginBottom: 10 }}>Recent Activity</div>
              {activity.map((item, i) => <ActivityItem key={i} item={item} />)}
            </div>
          )}

          {/* RIGHT PANEL */}
          <div style={{ width: 240, background: "#0d0d14", borderLeft: "0.5px solid rgba(255,255,255,0.07)", padding: "16px 14px", overflow: "auto", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", letterSpacing: .5, textTransform: "uppercase", marginBottom: 12 }}>Live Feed</div>
            {activity.slice(0, 6).map((item, i) => <ActivityItem key={i} item={item} />)}
            <div style={{ marginTop: 16, fontSize: 11, color: "#4a4a6a", letterSpacing: .5, textTransform: "uppercase", marginBottom: 12 }}>Quick Actions</div>
            {AGENTS.map(a => (
              <button key={a.id} onClick={() => { selectAgent(a); setView("console"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 8, cursor: "pointer", marginBottom: 6, color: "#9b9bb8", fontSize: 12, textAlign: "left" }}>
                <span>{a.emoji}</span> Run {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
