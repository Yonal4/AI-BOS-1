import { useState, useEffect, useRef, useReducer } from "react";

// ─── DESIGN SYSTEM ───────────────────────────────────────────
const T = {
  bg:     "#0a0a0f",
  bg2:    "#0f0f17",
  bg3:    "#141420",
  bg4:    "#1a1a28",
  border: "rgba(255,255,255,0.07)",
  border2:"rgba(255,255,255,0.12)",
  text:   "#f2f2fa",
  text2:  "#9494b0",
  text3:  "#55556a",
  purple: "#6c63fa",
  purple2:"#9b94ff",
  teal:   "#1ec8a6",
  coral:  "#f0604a",
  gold:   "#f5c84a",
  green:  "#3dd68c",
  grad:   "linear-gradient(135deg,#6c63fa 0%,#1ec8a6 100%)",
};

// ─── GLOBAL STATE (replaces DB in this frontend-only demo) ───
const initialState = {
  view: "auth",
  authTab: "signin",
  user: null,
  org: null,
  // Company Brain
  documents: [],
  chunks: [],
  // Marketing Agent
  campaigns: [],
  leads: [],
  // Sales Agent
  outreachQueue: [],
  // Collaboration log
  events: [],
  // UI
  activeNav: "brain",
  notification: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "AUTH": return { ...state, view: "app", user: action.user, org: action.org, activeNav: "brain" };
    case "SET_NAV": return { ...state, activeNav: action.nav };
    case "ADD_DOC": return { ...state, documents: [action.doc, ...state.documents] };
    case "ADD_LEAD": return { ...state, leads: [action.lead, ...state.leads] };
    case "ADD_CAMPAIGN": return { ...state, campaigns: [action.campaign, ...state.campaigns] };
    case "UPDATE_LEAD": return { ...state, leads: state.leads.map(l => l.id === action.id ? { ...l, ...action.updates } : l) };
    case "ADD_OUTREACH": return { ...state, outreachQueue: [action.item, ...state.outreachQueue] };
    case "UPDATE_OUTREACH": return { ...state, outreachQueue: state.outreachQueue.map(o => o.id === action.id ? { ...o, ...action.updates } : o) };
    case "ADD_EVENT": return { ...state, events: [action.event, ...state.events] };
    case "NOTIFY": return { ...state, notification: action.msg };
    case "CLEAR_NOTIFY": return { ...state, notification: null };
    default: return state;
  }
}

// ─── TINY COMPONENTS ─────────────────────────────────────────
const Sp = ({ size = 14, color = T.purple }) => (
  <span style={{ display:"inline-block", width:size, height:size, border:`2px solid rgba(255,255,255,0.15)`, borderTopColor:color, borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />
);

const Badge = ({ children, color = T.purple2, bg }) => (
  <span style={{ padding:"2px 8px", borderRadius:20, background: bg || `${color}20`, color, fontSize:11, fontWeight:600, letterSpacing:.3 }}>{children}</span>
);

const Btn = ({ children, onClick, variant="primary", style={}, disabled=false, loading=false }) => {
  const v = {
    primary: { background:T.purple, color:"#fff", border:"none" },
    ghost:   { background:"rgba(255,255,255,0.05)", color:T.text2, border:`1px solid ${T.border2}` },
    teal:    { background:T.teal, color:"#fff", border:"none" },
    danger:  { background:"rgba(240,96,74,0.12)", color:T.coral, border:`1px solid rgba(240,96,74,0.25)` },
    outline: { background:"transparent", color:T.purple2, border:`1px solid rgba(108,99,250,0.4)` },
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{ padding:"9px 18px", borderRadius:9, fontSize:13, fontWeight:600,
        cursor: (disabled||loading) ? "not-allowed" : "pointer", opacity:(disabled||loading)?.55:1,
        display:"inline-flex", alignItems:"center", gap:7, transition:".15s",
        ...v[variant], ...style }}>
      {loading && <Sp size={12} color={v[variant]?.color||"#fff"} />}
      {children}
    </button>
  );
};

const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px", ...style, cursor:onClick?"pointer":"default" }}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder, type="text", style={} }) => (
  <div style={{ marginBottom:16 }}>
    {label && <div style={{ fontSize:12, fontWeight:500, color:T.text2, marginBottom:6 }}>{label}</div>}
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border2}`,
        borderRadius:9, color:T.text, fontSize:14, outline:"none", fontFamily:"Inter,system-ui,sans-serif", ...style }} />
  </div>
);

// ─── UTILITIES ───────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10);
const now = () => new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

function extractChunks(text, title) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += 120) {
    chunks.push({ id: uid(), text: words.slice(i, i+120).join(" "), title, ts: Date.now() });
  }
  return chunks.length ? chunks : [{ id: uid(), text: text.slice(0,300), title, ts: Date.now() }];
}

async function callClaude(system, userMsg, maxTokens=600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages:[{ role:"user", content:userMsg }]
    })
  });
  const data = await res.json();
  return data.content?.find(b=>b.type==="text")?.text || "";
}

// ─── AUTH VIEW ───────────────────────────────────────────────
function AuthView({ dispatch }) {
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email || !password) { setErr("Please fill in all fields."); return; }
    if (tab === "signup" && (!name || !org)) { setErr("Please fill in all fields."); return; }
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 800));
    dispatch({ type:"AUTH",
      user: { id:uid(), name: name||email.split("@")[0], email, role:"owner" },
      org:  { id:uid(), name: org||"My Company", plan:"growth" }
    });
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:T.bg, fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420, padding:24 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:44, height:44, background:T.grad, borderRadius:12, display:"inline-flex",
            alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", marginBottom:14 }}>B</div>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:-.5, color:T.text }}>AI BOS</div>
          <div style={{ fontSize:13, color:T.text3, marginTop:4 }}>AI Workforce Platform</div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:T.bg3, borderRadius:10, padding:4, marginBottom:28 }}>
          {["signin","signup"].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }}
              style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", fontSize:13, fontWeight:600,
                cursor:"pointer", background:tab===t?T.bg2:"transparent", color:tab===t?T.text:T.text3, transition:".15s" }}>
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <Card style={{ border:`1px solid ${T.border2}` }}>
          {tab === "signup" && <Input label="Your name" value={name} onChange={setName} placeholder="Jane Smith" />}
          {tab === "signup" && <Input label="Company name" value={org} onChange={setOrg} placeholder="Acme Inc." />}
          <Input label="Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {err && <div style={{ fontSize:13, color:T.coral, marginBottom:12 }}>{err}</div>}
          <Btn onClick={submit} loading={loading} style={{ width:"100%", justifyContent:"center", padding:"11px 0" }}>
            {tab === "signin" ? "Sign in →" : "Create account →"}
          </Btn>
          <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:T.text3 }}>
            {tab==="signin"
              ? <span>No account? <span onClick={()=>setTab("signup")} style={{ color:T.purple2, cursor:"pointer" }}>Sign up free</span></span>
              : <span>Have an account? <span onClick={()=>setTab("signin")} style={{ color:T.purple2, cursor:"pointer" }}>Sign in</span></span>
            }
          </div>
        </Card>
        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:T.text3 }}>
          No credit card required · 14-day free trial
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
const NAV = [
  { id:"brain",     icon:"🧠", label:"Company Brain" },
  { id:"marketing", icon:"📣", label:"Marketing Agent" },
  { id:"sales",     icon:"📊", label:"Sales Agent" },
  { id:"collab",    icon:"⚡", label:"Collaboration Feed" },
  { id:"settings",  icon:"⚙️", label:"Settings" },
];

function Sidebar({ state, dispatch }) {
  const { activeNav, user, org, leads, events } = state;
  const unread = events.filter(e => !e.read).length;
  return (
    <div style={{ width:220, background:T.bg2, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0, padding:"0 10px" }}>
      {/* Logo */}
      <div style={{ padding:"18px 8px 14px", display:"flex", alignItems:"center", gap:10,
        borderBottom:`1px solid ${T.border}`, marginBottom:10 }}>
        <div style={{ width:30, height:30, background:T.grad, borderRadius:8, display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>B</div>
        <div>
          <div style={{ fontWeight:700, fontSize:14, letterSpacing:-.3, lineHeight:1.2 }}>AI BOS</div>
          <div style={{ fontSize:10, color:T.text3 }}>{org?.name}</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ fontSize:9, color:T.text3, letterSpacing:.8, textTransform:"uppercase", padding:"8px 8px 4px" }}>Workspace</div>
      {NAV.map(n => (
        <div key={n.id} onClick={() => dispatch({ type:"SET_NAV", nav:n.id })} style={{
          display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:9,
          cursor:"pointer", marginBottom:2, transition:".12s",
          background: activeNav===n.id ? "rgba(108,99,250,0.14)" : "transparent",
          color: activeNav===n.id ? T.purple2 : T.text3, fontSize:13,
          fontWeight: activeNav===n.id ? 600 : 400,
          border: activeNav===n.id ? `1px solid rgba(108,99,250,0.22)` : "1px solid transparent",
        }}>
          <span style={{ fontSize:14, lineHeight:1 }}>{n.icon}</span>
          <span style={{ flex:1 }}>{n.label}</span>
          {n.id === "collab" && unread > 0 && (
            <span style={{ background:T.coral, color:"#fff", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10 }}>{unread}</span>
          )}
        </div>
      ))}

      {/* Brain health */}
      <div style={{ marginTop:"auto", padding:"12px 8px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:10, color:T.text3, marginBottom:5 }}>Brain health</div>
        <div style={{ height:3, background:`${T.border}`, borderRadius:3 }}>
          <div style={{ height:"100%", width:`${Math.min(100, state.documents.length * 18 + (state.chunks.length > 0 ? 20 : 0))}%`,
            background:T.grad, borderRadius:3, transition:".5s" }} />
        </div>
        <div style={{ fontSize:10, color:T.text3, marginTop:4 }}>{state.documents.length} docs · {state.chunks.length} chunks</div>
      </div>

      {/* User */}
      <div style={{ padding:"10px 8px 14px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(108,99,250,0.25)", display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.purple2, flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{user?.name}</div>
          <div style={{ fontSize:10, color:T.text3 }}>Owner</div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPANY BRAIN ───────────────────────────────────────────
function BrainView({ state, dispatch }) {
  const [tab, setTab] = useState("docs");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [querying, setQuerying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const DOC_TYPES = [
    { id:"product", emoji:"📦", label:"Product Docs", hint:"Features, use cases, pricing" },
    { id:"icp",     emoji:"👤", label:"ICP & Personas", hint:"Who you sell to, pain points" },
    { id:"playbook",emoji:"📖", label:"Sales Playbook", hint:"Scripts, objections, sequences" },
    { id:"brand",   emoji:"✍️", label:"Brand Voice", hint:"Tone, messaging, rules" },
    { id:"case",    emoji:"🏆", label:"Case Studies", hint:"Customer wins, ROI data" },
  ];

  const addDoc = async (title, content, type="paste") => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 600));
    const doc = { id:uid(), title, content, type, chars:content.length, ts: Date.now() };
    const newChunks = extractChunks(content, title);
    dispatch({ type:"ADD_DOC", doc });
    newChunks.forEach(c => dispatch({ type:"ADD_EVENT", event:{ id:uid(), ts:Date.now(), type:"brain", agent:"Brain", text:`Indexed chunk from "${title}"` } }));
    // Fake chunks stored via events (in real app: vector store)
    state.chunks.push(...newChunks); // mutable for demo simplicity
    setUploading(false);
    dispatch({ type:"NOTIFY", msg:`✓ "${title}" added to Company Brain` });
    setTimeout(() => dispatch({ type:"CLEAR_NOTIFY" }), 3000);
    setPasteTitle(""); setPasteContent("");
  };

  const handleFile = async (file) => {
    const text = await file.text();
    await addDoc(file.name.replace(/\.[^.]+$/,""), text, file.name.endsWith(".pdf") ? "pdf" : "docx");
  };

  const searchBrain = async () => {
    if (!query.trim()) return;
    setQuerying(true); setQueryResult("");
    const ctx = state.documents.slice(0,5).map(d => `[${d.title}]: ${d.content.slice(0,300)}`).join("\n\n");
    const sys = `You are the AI BOS Company Brain. Answer questions using ONLY the indexed company knowledge below. If the knowledge base doesn't have the answer, say so clearly. Be specific and cite the source document.\n\nINDEXED KNOWLEDGE:\n${ctx || "No documents indexed yet."}`;
    const result = await callClaude(sys, query, 500);
    setQueryResult(result);
    setQuerying(false);
  };

  const health = Math.min(100, state.documents.length * 20);

  return (
    <div style={{ flex:1, overflow:"auto", padding:28, background:T.bg }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-.5, marginBottom:4 }}>🧠 Company Brain</div>
        <div style={{ fontSize:13, color:T.text3 }}>The shared intelligence powering all your AI agents. Upload docs to make them smarter.</div>
      </div>

      {/* Health */}
      <Card style={{ marginBottom:20, background:"rgba(108,99,250,0.06)", border:`1px solid rgba(108,99,250,0.2)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>Brain Health Score</div>
          <div style={{ fontSize:28, fontWeight:800, color: health>60?T.teal:health>30?T.gold:T.coral }}>{health}%</div>
        </div>
        <div style={{ height:6, background:`${T.border}`, borderRadius:6, marginBottom:10 }}>
          <div style={{ height:"100%", width:`${health}%`,
            background: health>60?T.teal:health>30?"linear-gradient(90deg,#f5c84a,#1ec8a6)":T.coral,
            borderRadius:6, transition:".5s" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { l:"Documents", v:state.documents.length, c:T.purple2 },
            { l:"Chunks indexed", v:state.chunks.length, c:T.teal },
            { l:"Missing types", v:Math.max(0,5-state.documents.length), c:T.coral },
            { l:"Coverage", v:`${health}%`, c:T.gold },
          ].map(m => (
            <div key={m.l}>
              <div style={{ fontSize:10, color:T.text3, marginBottom:3 }}>{m.l.toUpperCase()}</div>
              <div style={{ fontSize:20, fontWeight:700, color:m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[{id:"docs",l:"📂 Documents"},{id:"add",l:"+ Add Knowledge"},{id:"search",l:"🔍 Search Brain"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
            border:`1px solid ${tab===t.id?T.purple:T.border}`,
            background: tab===t.id ? "rgba(108,99,250,0.14)" : "transparent",
            color: tab===t.id ? T.purple2 : T.text3
          }}>{t.l}</button>
        ))}
      </div>

      {/* DOCS TAB */}
      {tab === "docs" && (
        <div>
          {state.documents.length === 0 && (
            <Card style={{ textAlign:"center", padding:"48px 24px", border:`1px dashed ${T.border2}` }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No documents yet</div>
              <div style={{ fontSize:13, color:T.text3, marginBottom:18 }}>Upload your first document to start training your AI workforce.</div>
              <Btn onClick={() => setTab("add")}>Add first document →</Btn>
            </Card>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {state.documents.map(d => (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                background:T.bg2, border:`1px solid ${T.border}`, borderRadius:12 }}>
                <div style={{ width:38, height:38, background:"rgba(108,99,250,0.15)", borderRadius:9,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                  {d.type==="pdf"?"📄":d.type==="docx"?"📝":"✏️"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{d.title}</div>
                  <div style={{ fontSize:11, color:T.text3 }}>{d.chars.toLocaleString()} chars · {extractChunks(d.content, d.title).length} chunks</div>
                </div>
                <Badge color={T.teal}>✓ Indexed</Badge>
              </div>
            ))}
          </div>
          {/* Suggested doc types */}
          {state.documents.length < 5 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:12, color:T.text3, fontWeight:600, marginBottom:10, letterSpacing:.5, textTransform:"uppercase" }}>Suggested documents</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                {DOC_TYPES.filter(dt => !state.documents.find(d=>d.type===dt.id)).map(dt => (
                  <div key={dt.id} style={{ padding:"14px 16px", background:T.bg3, border:`1px dashed ${T.border2}`,
                    borderRadius:10, cursor:"pointer" }} onClick={() => { setTab("add"); setPasteTitle(dt.label); }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{dt.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{dt.label}</div>
                    <div style={{ fontSize:11, color:T.text3 }}>{dt.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD TAB */}
      {tab === "add" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* File upload */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Upload File</div>
            <div style={{ fontSize:12, color:T.text3, marginBottom:16 }}>PDF, DOCX, or TXT files</div>
            <div onClick={() => fileRef.current?.click()} style={{
              border:`1.5px dashed ${T.border2}`, borderRadius:10, padding:"32px 20px",
              textAlign:"center", cursor:"pointer", marginBottom:12 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>☁️</div>
              <div style={{ fontSize:13, color:T.text2 }}>Click to upload file</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:4 }}>PDF · DOCX · TXT</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display:"none" }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {uploading && <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.purple2 }}><Sp size={12} />Indexing...</div>}
          </Card>

          {/* Paste text */}
          <Card>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Paste Content</div>
            <div style={{ fontSize:12, color:T.text3, marginBottom:16 }}>Paste any text to add to brain</div>
            <Input label="Document title" value={pasteTitle} onChange={setPasteTitle} placeholder="e.g. Sales Playbook Q3 2026" />
            <div style={{ fontSize:12, fontWeight:500, color:T.text2, marginBottom:6 }}>Content</div>
            <textarea value={pasteContent} onChange={e=>setPasteContent(e.target.value)}
              placeholder="Paste your document content here. The more detail you add, the smarter your agents become."
              style={{ width:"100%", minHeight:140, padding:"10px 14px", background:"rgba(255,255,255,0.04)",
                border:`1px solid ${T.border2}`, borderRadius:9, color:T.text, fontSize:13, resize:"vertical",
                outline:"none", lineHeight:1.6, fontFamily:"Inter,system-ui,sans-serif", marginBottom:10 }} />
            <div style={{ fontSize:11, color:T.text3, marginBottom:12 }}>
              {pasteContent.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1,Math.ceil(pasteContent.split(/\s+/).length/120))} chunks
            </div>
            <Btn onClick={() => addDoc(pasteTitle||"Untitled", pasteContent)} loading={uploading}
              disabled={!pasteContent.trim() || !pasteTitle.trim()}>Add to Brain</Btn>
          </Card>
        </div>
      )}

      {/* SEARCH TAB */}
      {tab === "search" && (
        <div>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12, color:T.purple2 }}>Query your Company Brain</div>
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchBrain()}
                placeholder="e.g. What's our ICP? How should we handle pricing objections?"
                style={{ flex:1, padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border2}`,
                  borderRadius:9, color:T.text, fontSize:13, outline:"none" }} />
              <Btn onClick={searchBrain} loading={querying}>Search →</Btn>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["What's our ICP?","How to handle pricing objections?","What are our key differentiators?","Who are our target customers?"].map(q=>(
                <button key={q} onClick={()=>setQuery(q)} style={{ padding:"4px 10px", background:"rgba(255,255,255,0.04)",
                  border:`1px solid ${T.border}`, borderRadius:20, fontSize:11, color:T.text3, cursor:"pointer" }}>{q}</button>
              ))}
            </div>
          </Card>
          {state.documents.length === 0 && (
            <Card style={{ textAlign:"center", padding:32, color:T.text3, fontSize:13 }}>
              No documents in brain yet. Add some knowledge first.
            </Card>
          )}
          {queryResult && (
            <Card style={{ background:"rgba(30,200,166,0.04)", border:`1px solid rgba(30,200,166,0.2)` }}>
              <div style={{ fontSize:11, color:T.teal, fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>🧠 Brain Response</div>
              <div style={{ fontSize:14, lineHeight:1.8, color:T.text, whiteSpace:"pre-wrap" }}>{queryResult}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MARKETING AGENT ─────────────────────────────────────────
const MKT_SYSTEM = (brainContext) => `You are Lexi, an expert AI Marketing Agent for an AI Business Operating System (AI BOS).

COMPANY BRAIN CONTEXT:
${brainContext || "No company documents indexed yet. Use general B2B SaaS marketing best practices."}

Your job:
1. Create targeted marketing campaigns for AI BOS
2. Generate qualified leads from your campaigns
3. Hand off leads to the Sales Agent with rich context

Be specific, direct, and outcome-focused. No fluff.`;

function MarketingView({ state, dispatch }) {
  const [tab, setTab] = useState("campaigns");
  const [goalInput, setGoalInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const brainCtx = state.documents.slice(0,4).map(d=>`[${d.title}]: ${d.content.slice(0,200)}`).join("\n");

  const createCampaign = async () => {
    if (!goalInput.trim()) return;
    setCreating(true);
    const prompt = `Create a marketing campaign for this goal: "${goalInput}"

Respond ONLY with valid JSON (no markdown):
{
  "name": "campaign name",
  "goal": "specific outcome",
  "channel": "LinkedIn|Email|Content|Paid",
  "targetAudience": "who this targets",
  "message": "core value proposition for this campaign",
  "cta": "call to action",
  "estimatedLeads": 12,
  "status": "Active"
}`;
    const result = await callClaude(MKT_SYSTEM(brainCtx), prompt, 500);
    try {
      const clean = result.replace(/```json|```/g,"").trim();
      const c = JSON.parse(clean);
      const campaign = { ...c, id:uid(), ts:Date.now(), leads:0 };
      dispatch({ type:"ADD_CAMPAIGN", campaign });
      dispatch({ type:"ADD_EVENT", event:{ id:uid(), ts:Date.now(), type:"marketing", agent:"Lexi",
        text:`Created campaign: "${campaign.name}" targeting ${campaign.targetAudience}` } });
      setGoalInput("");
      setSelectedCampaign(campaign.id);
      setTab("campaigns");
    } catch(e) {}
    setCreating(false);
  };

  const generateLead = async (campaign) => {
    setGenerating(campaign.id);
    const prompt = `You are running the "${campaign.name}" campaign targeting "${campaign.targetAudience}".

Generate ONE realistic qualified lead that would respond to this campaign.
Respond ONLY with valid JSON (no markdown):
{
  "name": "full name",
  "title": "job title",
  "company": "company name",
  "email": "work email",
  "companySize": "e.g. 45 employees",
  "industry": "SaaS|E-commerce|Agency|Fintech",
  "painPoint": "specific pain point relevant to our product",
  "score": 78,
  "source": "${campaign.channel}",
  "campaignId": "${campaign.id}",
  "campaignName": "${campaign.name}"
}`;
    const result = await callClaude(MKT_SYSTEM(brainCtx), prompt, 400);
    try {
      const clean = result.replace(/```json|```/g,"").trim();
      const lead = { ...JSON.parse(clean), id:uid(), status:"new", ts:Date.now() };
      dispatch({ type:"ADD_LEAD", lead });
      dispatch({ type:"ADD_EVENT", event:{ id:uid(), ts:Date.now(), type:"marketing", agent:"Lexi",
        text:`Generated lead: ${lead.name} (${lead.title} at ${lead.company}) → sent to Sales Agent` } });
      dispatch({ type:"NOTIFY", msg:`🎯 Lead generated: ${lead.name} → Sales Agent notified` });
      setTimeout(() => dispatch({ type:"CLEAR_NOTIFY" }), 3500);
    } catch(e) {}
    setGenerating(null);
  };

  const scoreColor = s => s>=85?T.teal:s>=70?T.gold:T.coral;

  return (
    <div style={{ flex:1, overflow:"auto", padding:28, background:T.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-.5, marginBottom:4 }}>📣 Marketing Agent — Lexi</div>
          <div style={{ fontSize:13, color:T.text3 }}>Creates campaigns, generates leads, hands off to Sales.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(30,200,166,0.1)",
          border:`1px solid rgba(30,200,166,0.25)`, borderRadius:20, padding:"6px 14px" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, boxShadow:`0 0 6px ${T.teal}` }}/>
          <span style={{ fontSize:12, color:T.teal, fontWeight:600 }}>Active</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { l:"Campaigns", v:state.campaigns.length, c:T.purple2 },
          { l:"Leads Generated", v:state.leads.length, c:T.teal },
          { l:"Avg Lead Score", v:state.leads.length?Math.round(state.leads.reduce((s,l)=>s+l.score,0)/state.leads.length):"—", c:T.gold },
          { l:"Sent to Sales", v:state.leads.filter(l=>l.status!=="new").length, c:T.green },
        ].map(k => (
          <Card key={k.l} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:T.text3, marginBottom:4, letterSpacing:.5 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:-1, color:k.c }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[{id:"campaigns",l:"Campaigns"},{id:"create",l:"+ New Campaign"},{id:"leads",l:`Leads (${state.leads.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
            border:`1px solid ${tab===t.id?"rgba(240,96,74,.5)":T.border}`,
            background: tab===t.id?"rgba(240,96,74,0.1)":"transparent",
            color: tab===t.id?T.coral:T.text3
          }}>{t.l}</button>
        ))}
      </div>

      {/* CREATE */}
      {tab === "create" && (
        <Card>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>New Campaign Goal</div>
          <div style={{ fontSize:12, color:T.text3, marginBottom:16 }}>Lexi will build the campaign strategy using your Company Brain.</div>
          {state.documents.length === 0 && (
            <div style={{ background:"rgba(245,200,74,0.08)", border:`1px solid rgba(245,200,74,0.2)`,
              borderRadius:9, padding:"10px 14px", fontSize:12, color:T.gold, marginBottom:14 }}>
              ⚠ No Company Brain documents yet. Lexi will use generic knowledge. Add docs for better results.
            </div>
          )}
          <textarea value={goalInput} onChange={e=>setGoalInput(e.target.value)}
            placeholder="e.g. Generate 20 qualified leads from funded SaaS startups with 10-100 employees"
            style={{ width:"100%", minHeight:90, padding:"12px 14px", background:"rgba(255,255,255,0.04)",
              border:`1px solid ${T.border2}`, borderRadius:9, color:T.text, fontSize:13,
              outline:"none", lineHeight:1.6, resize:"none", fontFamily:"Inter,system-ui,sans-serif", marginBottom:12 }} />
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {["Generate 20 SaaS leads this month","Run LinkedIn outreach to CTOs","Email campaign for Series A founders","Content push targeting e-commerce operators"].map(ex=>(
              <button key={ex} onClick={()=>setGoalInput(ex)} style={{ padding:"3px 9px",
                background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`,
                borderRadius:20, fontSize:11, color:T.text3, cursor:"pointer" }}>{ex}</button>
            ))}
          </div>
          <Btn onClick={createCampaign} loading={creating} disabled={!goalInput.trim()}>
            Create Campaign →
          </Btn>
        </Card>
      )}

      {/* CAMPAIGNS */}
      {tab === "campaigns" && (
        <div>
          {state.campaigns.length === 0 && (
            <Card style={{ textAlign:"center", padding:"48px 24px", border:`1px dashed ${T.border2}` }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📣</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No campaigns yet</div>
              <div style={{ fontSize:13, color:T.text3, marginBottom:18 }}>Create your first campaign and let Lexi start generating leads.</div>
              <Btn onClick={() => setTab("create")}>Create first campaign →</Btn>
            </Card>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {state.campaigns.map(c => (
              <Card key={c.id} style={{ border:`1px solid ${selectedCampaign===c.id?"rgba(240,96,74,.35)":T.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{c.name}</div>
                    <div style={{ fontSize:12, color:T.text3 }}>{c.goal}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                    <Badge color={T.teal}>{c.channel}</Badge>
                    <Badge color={T.green}>Active</Badge>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                  <div style={{ padding:"10px 12px", background:T.bg3, borderRadius:8 }}>
                    <div style={{ fontSize:10, color:T.text3, marginBottom:3 }}>TARGET AUDIENCE</div>
                    <div style={{ fontSize:12, color:T.text2 }}>{c.targetAudience}</div>
                  </div>
                  <div style={{ padding:"10px 12px", background:T.bg3, borderRadius:8 }}>
                    <div style={{ fontSize:10, color:T.text3, marginBottom:3 }}>CALL TO ACTION</div>
                    <div style={{ fontSize:12, color:T.text2 }}>{c.cta}</div>
                  </div>
                </div>
                <div style={{ padding:"10px 12px", background:T.bg3, borderRadius:8, marginBottom:14, fontSize:12, color:T.text2, lineHeight:1.6 }}>
                  <span style={{ color:T.text3, fontWeight:600 }}>Message: </span>{c.message}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:12, color:T.text3 }}>Est. leads: <span style={{ color:T.gold, fontWeight:600 }}>{c.estimatedLeads}</span> · Generated: <span style={{ color:T.teal, fontWeight:600 }}>{state.leads.filter(l=>l.campaignId===c.id).length}</span></div>
                  <Btn onClick={() => generateLead(c)} loading={generating===c.id} variant="outline" style={{ fontSize:12, padding:"7px 14px" }}>
                    Generate Lead →
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* LEADS */}
      {tab === "leads" && (
        <div>
          {state.leads.length === 0 && (
            <Card style={{ textAlign:"center", padding:"48px 24px", border:`1px dashed ${T.border2}`, color:T.text3, fontSize:13 }}>
              No leads yet. Run a campaign to generate leads.
            </Card>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {state.leads.map(l => (
              <Card key={l.id} style={{ padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(240,96,74,0.15)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:T.coral, flexShrink:0 }}>
                    {l.name?.[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{l.name} <span style={{ color:T.text3, fontWeight:400 }}>·</span> {l.title} <span style={{ color:T.text3, fontWeight:400 }}>at</span> {l.company}</div>
                    <div style={{ fontSize:11, color:T.text3 }}>{l.email} · {l.companySize} · {l.source}</div>
                    <div style={{ fontSize:11, color:T.text2, marginTop:3 }}>Pain: {l.painPoint}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:18, fontWeight:700, color:scoreColor(l.score), marginBottom:4 }}>{l.score}</div>
                    <Badge color={l.status==="new"?T.gold:T.teal}>{l.status==="new"?"Pending Sales":"In Pipeline"}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SALES AGENT ─────────────────────────────────────────────
const SALES_SYSTEM = (brainContext) => `You are Aria, an expert AI Sales Development Representative for an AI Business Operating System (AI BOS).

COMPANY BRAIN CONTEXT:
${brainContext || "Use general B2B SaaS sales best practices. Be professional and persuasive."}

Your job:
1. Receive qualified leads from the Marketing Agent
2. Analyze each lead's context and pain points
3. Write highly personalized outreach — NOT generic templates
4. Reference their specific company situation, pain point, and how AI BOS solves it
5. Move leads through the pipeline

Write like a human, not a robot. Under 120 words per email. Direct, specific, warm.`;

function SalesView({ state, dispatch }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [drafting, setDrafting] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [stage, setStage] = useState("all");

  const brainCtx = state.documents.slice(0,4).map(d=>`[${d.title}]: ${d.content.slice(0,200)}`).join("\n");

  const draftOutreach = async (lead) => {
    setDrafting(lead.id);
    const prompt = `Write a personalized cold outreach email for this prospect:

Name: ${lead.name}
Title: ${lead.title}
Company: ${lead.company} (${lead.companySize})
Industry: ${lead.industry}
Their pain point: ${lead.painPoint}
How they found us: ${lead.source} via campaign "${lead.campaignName}"

Write the email. Keep it under 120 words. Be specific about their situation.`;

    const result = await callClaude(SALES_SYSTEM(brainCtx), prompt, 400);
    setDrafts(p => ({ ...p, [lead.id]:result }));
    dispatch({ type:"UPDATE_LEAD", id:lead.id, updates:{ status:"drafted" } });
    dispatch({ type:"ADD_EVENT", event:{ id:uid(), ts:Date.now(), type:"sales", agent:"Aria",
      text:`Drafted outreach for ${lead.name} (${lead.title} at ${lead.company})` } });
    setDrafting(null);
  };

  const markSent = (lead) => {
    dispatch({ type:"UPDATE_LEAD", id:lead.id, updates:{ status:"contacted" } });
    dispatch({ type:"ADD_EVENT", event:{ id:uid(), ts:Date.now(), type:"sales", agent:"Aria",
      text:`Sent outreach to ${lead.name} at ${lead.company} — moved to "Contacted"` } });
    dispatch({ type:"NOTIFY", msg:`✓ Outreach sent to ${lead.name}` });
    setTimeout(() => dispatch({ type:"CLEAR_NOTIFY" }), 2500);
  };

  const scoreColor = s => s>=85?T.teal:s>=70?T.gold:T.coral;
  const newLeads = state.leads.filter(l=>l.status==="new");
  const stages = { all:state.leads, new:state.leads.filter(l=>l.status==="new"), drafted:state.leads.filter(l=>l.status==="drafted"), contacted:state.leads.filter(l=>l.status==="contacted") };

  return (
    <div style={{ flex:1, overflow:"auto", padding:28, background:T.bg }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:-.5, marginBottom:4 }}>📊 Sales Agent — Aria</div>
          <div style={{ fontSize:13, color:T.text3 }}>Receives leads from Marketing, drafts outreach, works the pipeline.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(30,200,166,0.1)",
          border:`1px solid rgba(30,200,166,0.25)`, borderRadius:20, padding:"6px 14px" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, boxShadow:`0 0 6px ${T.teal}` }}/>
          <span style={{ fontSize:12, color:T.teal, fontWeight:600 }}>Active</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { l:"Leads Received", v:state.leads.length, c:T.purple2 },
          { l:"New", v:state.leads.filter(l=>l.status==="new").length, c:T.gold },
          { l:"Drafted", v:state.leads.filter(l=>l.status==="drafted").length, c:T.purple2 },
          { l:"Contacted", v:state.leads.filter(l=>l.status==="contacted").length, c:T.green },
        ].map(k => (
          <Card key={k.l} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:T.text3, marginBottom:4, letterSpacing:.5 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:-1, color:k.c }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* New leads alert */}
      {newLeads.length > 0 && (
        <div style={{ background:"rgba(108,99,250,0.08)", border:`1px solid rgba(108,99,250,0.25)`,
          borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:T.purple, animation:"spin 2s linear infinite" }}/>
            <span style={{ fontSize:13, fontWeight:600, color:T.purple2 }}>{newLeads.length} new lead{newLeads.length>1?"s":""} from Marketing Agent waiting for outreach</span>
          </div>
          <Btn onClick={() => setSelectedLead(newLeads[0])} style={{ fontSize:12, padding:"6px 14px" }}>Review →</Btn>
        </div>
      )}

      {/* Pipeline tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[{id:"all",l:`All (${state.leads.length})`},{id:"new",l:`New (${newLeads.length})`},{id:"drafted",l:`Drafted`},{id:"contacted",l:`Contacted`}].map(t=>(
          <button key={t.id} onClick={()=>setStage(t.id)} style={{
            padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
            border:`1px solid ${stage===t.id?"rgba(108,99,250,.4)":T.border}`,
            background: stage===t.id?"rgba(108,99,250,0.1)":"transparent",
            color: stage===t.id?T.purple2:T.text3
          }}>{t.l}</button>
        ))}
      </div>

      {state.leads.length === 0 && (
        <Card style={{ textAlign:"center", padding:"48px 24px", border:`1px dashed ${T.border2}` }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📬</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>Waiting for leads</div>
          <div style={{ fontSize:13, color:T.text3 }}>Go to Marketing Agent → create a campaign → generate leads. They'll appear here automatically.</div>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns: selectedLead ? "1fr 420px" : "1fr", gap:16 }}>
        {/* Lead list */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(stages[stage]||[]).map(l => (
            <Card key={l.id} onClick={() => setSelectedLead(l)}
              style={{ border:`1px solid ${selectedLead?.id===l.id?"rgba(108,99,250,.4)":T.border}`,
                background: selectedLead?.id===l.id?"rgba(108,99,250,0.06)":T.bg2 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(108,99,250,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:T.purple2, flexShrink:0 }}>
                  {l.name?.[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{l.name} · {l.title}</div>
                  <div style={{ fontSize:11, color:T.text3 }}>{l.company} · {l.companySize}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:scoreColor(l.score) }}>{l.score}</div>
                  <Badge color={l.status==="new"?T.gold:l.status==="drafted"?T.purple2:T.green}>
                    {l.status==="new"?"New":l.status==="drafted"?"Draft ready":"Contacted"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Lead detail / outreach panel */}
        {selectedLead && (
          <Card style={{ border:`1px solid rgba(108,99,250,.25)`, position:"sticky", top:0, alignSelf:"start" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{selectedLead.name}</div>
                <div style={{ fontSize:12, color:T.text3 }}>{selectedLead.title} · {selectedLead.company}</div>
              </div>
              <button onClick={()=>setSelectedLead(null)} style={{ background:"none", border:"none", color:T.text3, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>

            {/* Lead details */}
            <div style={{ marginBottom:14 }}>
              {[
                { l:"Email", v:selectedLead.email },
                { l:"Company size", v:selectedLead.companySize },
                { l:"Industry", v:selectedLead.industry },
                { l:"Source", v:`${selectedLead.source} · ${selectedLead.campaignName}` },
                { l:"Lead score", v:selectedLead.score+"/100" },
              ].map(r=>(
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0",
                  borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <span style={{ color:T.text3 }}>{r.l}</span>
                  <span style={{ color:T.text, fontWeight:500 }}>{r.v}</span>
                </div>
              ))}
              <div style={{ padding:"8px 0", fontSize:12 }}>
                <div style={{ color:T.text3, marginBottom:4 }}>Pain point</div>
                <div style={{ color:T.text2, lineHeight:1.5 }}>{selectedLead.painPoint}</div>
              </div>
            </div>

            {/* Outreach draft */}
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.purple2, marginBottom:10 }}>✍️ Aria's Outreach</div>
              {!drafts[selectedLead.id] && selectedLead.status === "new" && (
                <Btn onClick={() => draftOutreach(selectedLead)} loading={drafting===selectedLead.id}
                  style={{ width:"100%", justifyContent:"center", marginBottom:10 }}>
                  Draft Personalized Email
                </Btn>
              )}
              {drafts[selectedLead.id] && (
                <div>
                  <textarea value={drafts[selectedLead.id]} onChange={e=>setDrafts(p=>({...p,[selectedLead.id]:e.target.value}))}
                    style={{ width:"100%", minHeight:160, padding:"10px 12px", background:"rgba(255,255,255,0.04)",
                      border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, fontSize:12,
                      lineHeight:1.7, resize:"vertical", outline:"none", fontFamily:"Inter,system-ui,sans-serif", marginBottom:10 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    {selectedLead.status !== "contacted" && (
                      <Btn variant="teal" onClick={() => markSent(selectedLead)} style={{ flex:1, justifyContent:"center", fontSize:12 }}>
                        ✓ Mark as Sent
                      </Btn>
                    )}
                    <Btn variant="ghost" onClick={() => draftOutreach(selectedLead)} loading={drafting===selectedLead.id} style={{ fontSize:12 }}>
                      Redraft
                    </Btn>
                  </div>
                </div>
              )}
              {selectedLead.status === "contacted" && !drafts[selectedLead.id] && (
                <Badge color={T.green} bg="rgba(61,214,140,0.12)">✓ Outreach sent</Badge>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── COLLABORATION FEED ──────────────────────────────────────
function CollabView({ state, dispatch }) {
  const typeConfig = {
    brain:     { color:T.purple2, bg:"rgba(108,99,250,0.15)", icon:"🧠" },
    marketing: { color:T.coral,   bg:"rgba(240,96,74,0.15)",  icon:"📣" },
    sales:     { color:T.purple,  bg:"rgba(108,99,250,0.15)", icon:"📊" },
    support:   { color:T.teal,    bg:"rgba(30,200,166,0.15)", icon:"🎧" },
    system:    { color:T.text3,   bg:"rgba(255,255,255,0.07)",icon:"⚙️" },
  };

  return (
    <div style={{ flex:1, overflow:"auto", padding:28, background:T.bg }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-.5, marginBottom:4 }}>⚡ Collaboration Feed</div>
        <div style={{ fontSize:13, color:T.text3 }}>Real-time log of agent actions and cross-agent handoffs.</div>
      </div>

      {/* Pipeline overview */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
        {[
          { l:"Brain Documents", v:state.documents.length, c:T.purple2, icon:"🧠" },
          { l:"Campaigns Active", v:state.campaigns.length, c:T.coral, icon:"📣" },
          { l:"Leads Generated", v:state.leads.length, c:T.teal, icon:"🎯" },
          { l:"Leads Contacted", v:state.leads.filter(l=>l.status==="contacted").length, c:T.green, icon:"✉️" },
        ].map(k => (
          <Card key={k.l} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{k.icon}</div>
            <div style={{ fontSize:10, color:T.text3, marginBottom:3, letterSpacing:.5 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:-1, color:k.c }}>{k.v}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline visualization */}
      {state.leads.length > 0 && (
        <Card style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Pipeline Flow</div>
          <div style={{ display:"flex", alignItems:"center", gap:0 }}>
            {[
              { l:"Brain Trained", v:state.documents.length > 0 ? 1 : 0, max:1, color:T.purple2 },
              { l:"Campaigns", v:state.campaigns.length, max:Math.max(state.campaigns.length,1), color:T.coral },
              { l:"Leads", v:state.leads.length, max:Math.max(state.leads.length,1), color:T.gold },
              { l:"Contacted", v:state.leads.filter(l=>l.status==="contacted").length, max:Math.max(state.leads.length,1), color:T.green },
            ].map((s,i,arr) => (
              <>
                <div key={s.l} style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:T.text3 }}>{s.l}</div>
                </div>
                {i<arr.length-1 && <div style={{ fontSize:18, color:T.border2, padding:"0 4px" }}>→</div>}
              </>
            ))}
          </div>
        </Card>
      )}

      {/* Events */}
      {state.events.length === 0 && (
        <Card style={{ textAlign:"center", padding:"48px 24px", border:`1px dashed ${T.border2}` }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🤝</div>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No activity yet</div>
          <div style={{ fontSize:13, color:T.text3 }}>
            Start by adding documents to your Company Brain, then create a campaign in Marketing Agent.
          </div>
        </Card>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {state.events.map(ev => {
          const cfg = typeConfig[ev.type] || typeConfig.system;
          return (
            <div key={ev.id} style={{ display:"flex", gap:12, padding:"12px 16px",
              background:T.bg2, border:`1px solid ${T.border}`, borderRadius:12, alignItems:"flex-start" }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:cfg.bg,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                {cfg.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.5 }}>
                  <span style={{ fontWeight:700, color:cfg.color }}>{ev.agent}</span> {ev.text}
                </div>
                <div style={{ fontSize:10, color:T.text3, marginTop:3 }}>{fmtTime(ev.ts)}</div>
              </div>
              <Badge color={cfg.color} bg={cfg.bg}>{ev.type}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────
function SettingsView({ state, dispatch }) {
  const [name, setName] = useState(state.org?.name || "");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  return (
    <div style={{ flex:1, overflow:"auto", padding:28, background:T.bg }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-.5, marginBottom:4 }}>⚙️ Settings</div>
        <div style={{ fontSize:13, color:T.text3 }}>Manage your workspace and AI agent preferences.</div>
      </div>
      <div style={{ maxWidth:540 }}>
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Organization</div>
          <Input label="Company name" value={name} onChange={setName} />
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:500, color:T.text2, marginBottom:6 }}>Plan</div>
            <Badge color={T.teal}>Growth — 3 AI Agents</Badge>
          </div>
          <Btn onClick={save}>{saved?"✓ Saved":"Save changes"}</Btn>
        </Card>
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Agent Autonomy</div>
          {[{n:"Lexi (Marketing)",role:"marketing"},{n:"Aria (Sales)",role:"sales"}].map(a=>(
            <div key={a.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{a.n}</div>
                <div style={{ fontSize:11, color:T.text3 }}>Controls what actions need your approval</div>
              </div>
              <select defaultValue="supervised" style={{ padding:"6px 10px", background:T.bg3,
                border:`1px solid ${T.border2}`, borderRadius:8, color:T.text2, fontSize:12, outline:"none" }}>
                <option value="copilot">Co-pilot</option>
                <option value="supervised">Supervised</option>
                <option value="autonomous">Autonomous</option>
              </select>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Account</div>
          <div style={{ fontSize:12, color:T.text3, marginBottom:14 }}>Signed in as {state.user?.email}</div>
          <Btn variant="danger" onClick={() => dispatch({ type:"AUTH", user:null, org:null, view:"auth" })}>
            Sign out
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg,
      fontFamily:"Inter,system-ui,sans-serif", color:T.text, overflow:"hidden" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing:border-box; }
        input,select,textarea { font-family:Inter,system-ui,sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {state.view === "auth" ? (
        <AuthView dispatch={dispatch} />
      ) : (
        <>
          <Sidebar state={state} dispatch={dispatch} />
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Topbar */}
            <div style={{ height:48, background:T.bg2, borderBottom:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", padding:"0 20px", gap:20, flexShrink:0 }}>
              <div style={{ flex:1, display:"flex", gap:18 }}>
                {[
                  { l:"Docs", v:state.documents.length, c:T.purple2 },
                  { l:"Campaigns", v:state.campaigns.length, c:T.coral },
                  { l:"Leads", v:state.leads.length, c:T.teal },
                  { l:"Contacted", v:state.leads.filter(l=>l.status==="contacted").length, c:T.green },
                ].map(m=>(
                  <div key={m.l} style={{ fontSize:12 }}>
                    <span style={{ color:T.text3, marginRight:5 }}>{m.l}</span>
                    <span style={{ fontWeight:700, color:m.c }}>{m.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal, boxShadow:`0 0 6px ${T.teal}` }}/>
                <span style={{ fontSize:12, color:T.teal }}>2 agents active</span>
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex:1, overflow:"hidden", display:"flex" }}>
              {state.activeNav === "brain"     && <BrainView state={state} dispatch={dispatch} />}
              {state.activeNav === "marketing" && <MarketingView state={state} dispatch={dispatch} />}
              {state.activeNav === "sales"     && <SalesView state={state} dispatch={dispatch} />}
              {state.activeNav === "collab"    && <CollabView state={state} dispatch={dispatch} />}
              {state.activeNav === "settings"  && <SettingsView state={state} dispatch={dispatch} />}
            </div>
          </div>

          {/* Toast notification */}
          {state.notification && (
            <div style={{ position:"fixed", bottom:24, right:24, background:T.bg3,
              border:`1px solid ${T.border2}`, borderRadius:12, padding:"12px 18px",
              fontSize:13, fontWeight:500, color:T.text, boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
              zIndex:1000, animation:"fadeIn .2s ease" }}>
              {state.notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
