import { useState, useEffect, useRef, useReducer, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const T = {
  bg:"#08080e",bg2:"#0d0d16",bg3:"#12121c",bg4:"#171723",
  border:"rgba(255,255,255,0.07)",border2:"rgba(255,255,255,0.13)",
  text:"#f0f0fa",text2:"#8f8fac",text3:"#4e4e6a",
  purple:"#6c5ff7",purple2:"#9d94ff",
  teal:"#16c49a",coral:"#f05a44",gold:"#f0b84a",green:"#38d47a",
  grad:"linear-gradient(135deg,#6c5ff7 0%,#16c49a 100%)",
};

// ─── PERSISTENCE ─────────────────────────────────────────────
const STORE_KEY = "aibos_v2_state";
async function persist(data) {
  try { await window.storage?.set(STORE_KEY, JSON.stringify(data)); } catch(e) {}
}
async function restore() {
  try {
    const r = await window.storage?.get(STORE_KEY);
    return r?.value ? JSON.parse(r.value) : null;
  } catch(e) { return null; }
}

// ─── GLOBAL STATE ────────────────────────────────────────────
const initState = {
  view:"auth", user:null, org:null, activeNav:"brain",
  documents:[], leads:[], campaigns:[], tickets:[], events:[], notification:null,
  outreachDrafts:{},
};

function reducer(state, a) {
  let next;
  switch(a.type) {
    case "HYDRATE":   next = { ...a.state, notification:null }; break;
    case "AUTH":      next = { ...state, view:"app", user:a.user, org:a.org, activeNav:"brain" }; break;
    case "SIGNOUT":   next = { ...initState, view:"auth" }; break;
    case "NAV":       next = { ...state, activeNav:a.nav }; break;
    case "ADD_DOC":   next = { ...state, documents:[a.doc,...state.documents] }; break;
    case "ADD_CAMPAIGN": next = { ...state, campaigns:[a.c,...state.campaigns] }; break;
    case "ADD_LEAD":  next = { ...state, leads:[a.lead,...state.leads] }; break;
    case "UPD_LEAD":  next = { ...state, leads:state.leads.map(l=>l.id===a.id?{...l,...a.u}:l) }; break;
    case "ADD_TICKET":next = { ...state, tickets:[a.t,...state.tickets] }; break;
    case "UPD_TICKET":next = { ...state, tickets:state.tickets.map(t=>t.id===a.id?{...t,...a.u}:t) }; break;
    case "SET_DRAFT": next = { ...state, outreachDrafts:{...state.outreachDrafts,[a.id]:a.text} }; break;
    case "ADD_EVENT": next = { ...state, events:[a.ev,...state.events].slice(0,100) }; break;
    case "NOTIFY":    next = { ...state, notification:a.msg }; break;
    case "CLEAR_N":   next = { ...state, notification:null }; break;
    default: return state;
  }
  if (a.type !== "NOTIFY" && a.type !== "CLEAR_N" && a.type !== "HYDRATE") {
    persist({ ...next, notification:null });
  }
  return next;
}

// ─── UTILITIES ───────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const ts = () => Date.now();
const fmtT = d => new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const fmtDate = d => new Date(d).toLocaleDateString([],{month:"short",day:"numeric"});
const scoreColor = s => s>=85?T.teal:s>=68?T.gold:T.coral;

async function claude(system, user, max=600) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:max,system,messages:[{role:"user",content:user}]})
  });
  const d = await r.json();
  return d.content?.find(b=>b.type==="text")?.text||"";
}
async function claudeJSON(system, user, max=700) {
  const raw = await claude(system,user,max);
  return JSON.parse(raw.replace(/```json|```/g,"").trim());
}

function brainCtx(docs) {
  return docs.slice(0,6).map(d=>`[${d.title}]: ${d.content.slice(0,280)}`).join("\n\n") || "No documents indexed yet. Use general B2B SaaS knowledge.";
}

// ─── ATOMS ───────────────────────────────────────────────────
const Spin = ({sz=13,c=T.purple}) => <span style={{display:"inline-block",width:sz,height:sz,border:"2px solid rgba(255,255,255,0.12)",borderTopColor:c,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;

const Pill = ({ch,color=T.purple2,bg}) => <span style={{padding:"2px 8px",borderRadius:20,background:bg||color+"22",color,fontSize:11,fontWeight:600,letterSpacing:.3}}>{ch}</span>;

const Btn = ({ch,onClick,v="primary",style={},disabled=false,loading=false}) => {
  const vs={primary:{background:T.purple,color:"#fff",border:"none"},ghost:{background:"rgba(255,255,255,0.04)",color:T.text2,border:`1px solid ${T.border2}`},teal:{background:T.teal,color:"#fff",border:"none"},danger:{background:"rgba(240,90,68,0.1)",color:T.coral,border:`1px solid rgba(240,90,68,0.22)`},outline:{background:"transparent",color:T.purple2,border:`1px solid rgba(108,99,247,0.35)`}};
  return <button onClick={onClick} disabled={disabled||loading} style={{padding:"8px 17px",borderRadius:9,fontSize:13,fontWeight:600,cursor:(disabled||loading)?"not-allowed":"pointer",opacity:(disabled||loading)?.5:1,display:"inline-flex",alignItems:"center",gap:7,transition:".15s",...vs[v],...style}}>{loading&&<Spin sz={11} c={vs[v]?.color||"#fff"}/>}{ch}</button>;
};

const Card = ({ch,style={},onClick}) => <div onClick={onClick} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",...style,cursor:onClick?"pointer":"default"}}>{ch}</div>;

const Inp = ({label,value,onChange,ph,type="text",rows,style={}}) => (
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:12,fontWeight:500,color:T.text2,marginBottom:5}}>{label}</div>}
    {rows
      ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} style={{width:"100%",padding:"9px 13px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border2}`,borderRadius:9,color:T.text,fontSize:13,outline:"none",lineHeight:1.6,resize:"vertical",fontFamily:"Inter,system-ui,sans-serif",...style}}/>
      : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} type={type} style={{width:"100%",padding:"9px 13px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border2}`,borderRadius:9,color:T.text,fontSize:13,outline:"none",fontFamily:"Inter,system-ui,sans-serif",...style}}/>
    }
  </div>
);

const EmptyState = ({icon,title,sub,action,actionLabel}) => (
  <Card style={{textAlign:"center",padding:"52px 28px",border:`1px dashed ${T.border2}`}} ch={<>
    <div style={{fontSize:38,marginBottom:14}}>{icon}</div>
    <div style={{fontSize:15,fontWeight:700,marginBottom:6,color:T.text}}>{title}</div>
    <div style={{fontSize:13,color:T.text3,marginBottom:action?20:0,lineHeight:1.6}}>{sub}</div>
    {action&&<Btn ch={actionLabel} onClick={action}/>}
  </>}/>
);

// ─── AUTH ────────────────────────────────────────────────────
function AuthView({dispatch}) {
  const [tab,setTab]=useState("signin");
  const [n,setN]=useState("");const [em,setEm]=useState("");const [pw,setPw]=useState("");const [org,setOrg]=useState("");
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const go = async () => {
    if(!em||!pw||(tab==="signup"&&(!n||!org))){setErr("Fill in all fields.");return;}
    setLoading(true);setErr("");
    await new Promise(r=>setTimeout(r,700));
    dispatch({type:"AUTH",user:{id:uid(),name:n||em.split("@")[0],email:em,role:"owner"},org:{id:uid(),name:org||"My Company",plan:"growth"}});
    setLoading(false);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400,padding:20}}>
        <div style={{textAlign:"center",marginBottom:38}}>
          <div style={{width:42,height:42,background:T.grad,borderRadius:12,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",marginBottom:14}}>B</div>
          <div style={{fontSize:23,fontWeight:800,letterSpacing:-.5,color:T.text}}>AI BOS</div>
          <div style={{fontSize:13,color:T.text3,marginTop:3}}>AI Workforce Platform</div>
        </div>
        <div style={{display:"flex",background:T.bg3,borderRadius:10,padding:4,marginBottom:24}}>
          {["signin","signup"].map(t=><button key={t} onClick={()=>{setTab(t);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",background:tab===t?T.bg2:"transparent",color:tab===t?T.text:T.text3,transition:".15s"}}>{t==="signin"?"Sign in":"Create account"}</button>)}
        </div>
        <Card style={{border:`1px solid ${T.border2}`}} ch={<>
          {tab==="signup"&&<Inp label="Your name" value={n} onChange={setN} ph="Jane Smith"/>}
          {tab==="signup"&&<Inp label="Company name" value={org} onChange={setOrg} ph="Acme Inc."/>}
          <Inp label="Email" value={em} onChange={setEm} ph="you@company.com" type="email"/>
          <Inp label="Password" value={pw} onChange={setPw} ph="••••••••" type="password"/>
          {err&&<div style={{fontSize:12,color:T.coral,marginBottom:10}}>{err}</div>}
          <Btn ch={tab==="signin"?"Sign in →":"Create account →"} onClick={go} loading={loading} style={{width:"100%",justifyContent:"center",padding:"10px 0"}}/>
          <div style={{textAlign:"center",marginTop:14,fontSize:12,color:T.text3}}>
            {tab==="signin"?<span>No account? <span onClick={()=>setTab("signup")} style={{color:T.purple2,cursor:"pointer"}}>Sign up free</span></span>:<span>Have an account? <span onClick={()=>setTab("signin")} style={{color:T.purple2,cursor:"pointer"}}>Sign in</span></span>}
          </div>
        </>}/>
        <div style={{textAlign:"center",marginTop:18,fontSize:12,color:T.text3}}>No credit card · 14-day free trial</div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
const NAV=[
  {id:"brain",icon:"🧠",label:"Company Brain"},
  {id:"marketing",icon:"📣",label:"Marketing Agent"},
  {id:"sales",icon:"📊",label:"Sales Agent"},
  {id:"support",icon:"🎧",label:"Support Agent"},
  {id:"collab",icon:"⚡",label:"Collaboration Feed"},
  {id:"settings",icon:"⚙️",label:"Settings"},
];

function Sidebar({state,dispatch}) {
  const {activeNav,user,org,documents,leads,tickets,events}=state;
  const newLeads=leads.filter(l=>l.status==="new").length;
  const openTickets=tickets.filter(t=>t.status==="open").length;
  return (
    <div style={{width:214,background:T.bg2,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,padding:"0 9px",overflowY:"auto"}}>
      <div style={{padding:"16px 7px 13px",display:"flex",alignItems:"center",gap:9,borderBottom:`1px solid ${T.border}`,marginBottom:10}}>
        <div style={{width:28,height:28,background:T.grad,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>B</div>
        <div><div style={{fontWeight:700,fontSize:13,letterSpacing:-.3,lineHeight:1.2}}>AI BOS</div><div style={{fontSize:10,color:T.text3}}>{org?.name}</div></div>
      </div>
      <div style={{fontSize:9,color:T.text3,letterSpacing:.8,textTransform:"uppercase",padding:"7px 8px 4px"}}>Workspace</div>
      {NAV.map(n=>{
        const badge=n.id==="sales"?newLeads:n.id==="support"?openTickets:0;
        return <div key={n.id} onClick={()=>dispatch({type:"NAV",nav:n.id})} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,cursor:"pointer",marginBottom:2,transition:".1s",background:activeNav===n.id?"rgba(108,99,247,0.14)":"transparent",color:activeNav===n.id?T.purple2:T.text3,fontSize:13,fontWeight:activeNav===n.id?600:400,border:activeNav===n.id?`1px solid rgba(108,99,247,0.2)`:"1px solid transparent"}}>
          <span style={{fontSize:14,lineHeight:1}}>{n.icon}</span>
          <span style={{flex:1}}>{n.label}</span>
          {badge>0&&<span style={{background:T.coral,color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:10}}>{badge}</span>}
        </div>;
      })}
      <div style={{marginTop:"auto",padding:"11px 7px",borderTop:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,color:T.text3,marginBottom:5}}>Brain health</div>
        <div style={{height:3,background:T.border,borderRadius:3}}><div style={{height:"100%",width:`${Math.min(100,documents.length*18+4)}%`,background:T.grad,borderRadius:3,transition:".5s"}}/></div>
        <div style={{fontSize:10,color:T.text3,marginTop:3}}>{documents.length} docs indexed</div>
      </div>
      <div style={{padding:"9px 7px 13px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(108,99,247,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.purple2,flexShrink:0}}>{user?.name?.[0]?.toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name}</div><div style={{fontSize:10,color:T.text3}}>Owner</div></div>
      </div>
    </div>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────
function Topbar({state}) {
  const {leads,campaigns,tickets}=state;
  const stats=[
    {l:"Docs",v:state.documents.length,c:T.purple2},
    {l:"Campaigns",v:campaigns.length,c:T.coral},
    {l:"Leads",v:leads.length,c:T.gold},
    {l:"Contacted",v:leads.filter(l=>l.status==="contacted").length,c:T.green},
    {l:"Tickets",v:tickets.length,c:T.teal},
  ];
  return (
    <div style={{height:46,background:T.bg2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:22,flexShrink:0}}>
      <div style={{display:"flex",gap:18,flex:1}}>
        {stats.map(s=><div key={s.l} style={{fontSize:12}}><span style={{color:T.text3,marginRight:4}}>{s.l}</span><span style={{fontWeight:700,color:s.c}}>{s.v}</span></div>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:T.teal,boxShadow:`0 0 6px ${T.teal}`}}/>
        <span style={{fontSize:12,color:T.teal}}>3 agents active</span>
      </div>
    </div>
  );
}

// ─── COMPANY BRAIN ───────────────────────────────────────────
function BrainView({state,dispatch}) {
  const [tab,setTab]=useState("docs");
  const [title,setTitle]=useState("");const [content,setContent]=useState("");
  const [query,setQuery]=useState("");const [qResult,setQR]=useState("");
  const [busy,setBusy]=useState(false);
  const fileRef=useRef();

  const addDoc = async (t,c,type="paste") => {
    setBusy(true);
    await new Promise(r=>setTimeout(r,500));
    const doc={id:uid(),title:t,content:c,type,chars:c.length,ts:ts()};
    dispatch({type:"ADD_DOC",doc});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Brain",kind:"brain",text:`Indexed "${t}" — ${Math.ceil(c.split(/\s+/).length/120)} chunks added`}});
    dispatch({type:"NOTIFY",msg:`✓ "${t}" indexed in Company Brain`});
    setTimeout(()=>dispatch({type:"CLEAR_N"}),3000);
    setTitle("");setContent("");setBusy(false);
  };

  const handleFile = async f => {
    const text=await f.text();
    await addDoc(f.name.replace(/\.[^.]+$/,""),text,f.name.endsWith(".pdf")?"pdf":"docx");
  };

  const search = async () => {
    if(!query.trim())return;setBusy(true);setQR("");
    const sys=`You are the AI BOS Company Brain. Answer using ONLY the indexed knowledge below. Cite sources. Be specific.\n\nINDEXED KNOWLEDGE:\n${brainCtx(state.documents)}`;
    const r=await claude(sys,query,500);setQR(r);setBusy(false);
  };

  const health=Math.min(100,state.documents.length*19+2);
  const tabs=[{id:"docs",l:"Documents"},{id:"add",l:"+ Add Knowledge"},{id:"search",l:"Search Brain"}];

  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{marginBottom:22}}><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>🧠 Company Brain</div><div style={{fontSize:13,color:T.text3}}>Shared intelligence powering all AI agents. The more you add, the smarter they become.</div></div>

      <Card style={{marginBottom:18,background:"rgba(108,99,247,0.05)",border:`1px solid rgba(108,99,247,0.18)`}} ch={<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:600}}>Brain Health</div>
          <div style={{fontSize:26,fontWeight:800,color:health>60?T.teal:health>30?T.gold:T.coral}}>{health}%</div>
        </div>
        <div style={{height:5,background:T.border,borderRadius:5,marginBottom:12}}><div style={{height:"100%",width:`${health}%`,background:health>60?T.teal:health>30?"linear-gradient(90deg,#f0b84a,#16c49a)":T.coral,borderRadius:5,transition:".6s"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[{l:"Documents",v:state.documents.length,c:T.purple2},{l:"Chunks",v:state.documents.reduce((s,d)=>s+Math.ceil(d.content.split(/\s+/).length/120),0),c:T.teal},{l:"Coverage",v:`${health}%`,c:T.gold}].map(m=><div key={m.l}><div style={{fontSize:10,color:T.text3,marginBottom:2}}>{m.l.toUpperCase()}</div><div style={{fontSize:20,fontWeight:700,color:m.c}}>{m.v}</div></div>)}
        </div>
      </>}/>

      <div style={{display:"flex",gap:4,marginBottom:18}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 15px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${tab===t.id?"rgba(108,99,247,.4)":T.border}`,background:tab===t.id?"rgba(108,99,247,0.12)":"transparent",color:tab===t.id?T.purple2:T.text3}}>{t.l}</button>)}
      </div>

      {tab==="docs"&&<>
        {state.documents.length===0&&<EmptyState icon="📭" title="No documents yet" sub="Upload your product docs, ICP guide, sales playbook, or brand voice. Every agent draws from this." action={()=>setTab("add")} actionLabel="Add first document →"/>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.documents.map(d=><div key={d.id} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 17px",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12}}>
            <div style={{width:36,height:36,background:"rgba(108,99,247,0.14)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{d.type==="pdf"?"📄":d.type==="docx"?"📝":"✏️"}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{d.title}</div><div style={{fontSize:11,color:T.text3}}>{(d.chars/1000).toFixed(1)}K chars · {Math.ceil(d.content.split(/\s+/).length/120)} chunks · {fmtDate(d.ts)}</div></div>
            <Pill ch="✓ Indexed" color={T.teal}/>
          </div>)}
        </div>
        {state.documents.length>0&&state.documents.length<5&&(
          <div style={{marginTop:18}}>
            <div style={{fontSize:11,color:T.text3,fontWeight:600,marginBottom:10,letterSpacing:.5,textTransform:"uppercase"}}>Suggested additions</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9}}>
              {[{e:"👤",l:"ICP & Personas"},{e:"📖",l:"Sales Playbook"},{e:"✍️",l:"Brand Voice"},{e:"🏆",l:"Case Studies"}].filter(s=>!state.documents.find(d=>d.title.toLowerCase().includes(s.l.toLowerCase().split(" ")[0]))).map(s=><div key={s.l} onClick={()=>{setTitle(s.l);setTab("add");}} style={{padding:"13px 15px",background:T.bg3,border:`1px dashed ${T.border2}`,borderRadius:10,cursor:"pointer"}}><div style={{fontSize:20,marginBottom:6}}>{s.e}</div><div style={{fontSize:12,fontWeight:600,color:T.text2}}>{s.l}</div></div>)}
            </div>
          </div>
        )}
      </>}

      {tab==="add"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>Upload File</div>
          <div style={{fontSize:12,color:T.text3,marginBottom:14}}>PDF, DOCX, or TXT</div>
          <div onClick={()=>fileRef.current?.click()} style={{border:`1.5px dashed ${T.border2}`,borderRadius:10,padding:"30px 16px",textAlign:"center",cursor:"pointer",marginBottom:10}}>
            <div style={{fontSize:26,marginBottom:7}}>☁️</div>
            <div style={{fontSize:13,color:T.text2}}>Click to upload</div>
            <div style={{fontSize:11,color:T.text3,marginTop:3}}>PDF · DOCX · TXT</div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
          {busy&&<div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:T.purple2}}><Spin sz={12}/>Indexing…</div>}
        </>}/>
        <Card ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>Paste Content</div>
          <div style={{fontSize:12,color:T.text3,marginBottom:14}}>Add any text to the brain</div>
          <Inp label="Document title" value={title} onChange={setTitle} ph="e.g. Sales Playbook Q3 2026"/>
          <Inp label="Content" value={content} onChange={setContent} ph="Paste your document content here…" rows={5}/>
          <div style={{fontSize:11,color:T.text3,marginBottom:12}}>{content.split(/\s+/).filter(Boolean).length} words · {Math.max(1,Math.ceil(content.split(/\s+/).length/120))} chunks</div>
          <Btn ch="Add to Brain" onClick={()=>addDoc(title||"Untitled",content)} loading={busy} disabled={!content.trim()||!title.trim()}/>
        </>}/>
      </div>}

      {tab==="search"&&<>
        <Card style={{marginBottom:14}} ch={<>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:T.purple2}}>Query Company Brain</div>
          <div style={{display:"flex",gap:9,marginBottom:11}}>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. What's our ICP? How should we handle pricing objections?" style={{flex:1,padding:"9px 13px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border2}`,borderRadius:9,color:T.text,fontSize:13,outline:"none"}}/>
            <Btn ch="Search →" onClick={search} loading={busy}/>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["What's our ICP?","How to handle pricing objections?","What are our key differentiators?","Describe our ideal customer"].map(q=><button key={q} onClick={()=>setQuery(q)} style={{padding:"3px 9px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,fontSize:11,color:T.text3,cursor:"pointer"}}>{q}</button>)}
          </div>
        </>}/>
        {state.documents.length===0&&<div style={{fontSize:13,color:T.text3,padding:"12px 0"}}>Add documents first to enable brain search.</div>}
        {qResult&&<Card style={{background:"rgba(22,196,154,0.04)",border:`1px solid rgba(22,196,154,0.18)`}} ch={<>
          <div style={{fontSize:11,color:T.teal,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>🧠 Brain Response</div>
          <div style={{fontSize:14,lineHeight:1.8,color:T.text,whiteSpace:"pre-wrap"}}>{qResult}</div>
        </>}/>}
      </>}
    </div>
  );
}

// ─── MARKETING AGENT ─────────────────────────────────────────
const MKT_SYS = ctx => `You are Lexi, AI Marketing Agent for an AI Business Operating System (AI BOS).

COMPANY BRAIN:\n${ctx}

Be specific and outcome-focused. Respond ONLY in valid JSON when asked.`;

function MarketingView({state,dispatch}) {
  const [tab,setTab]=useState("campaigns");
  const [goal,setGoal]=useState("");
  const [busy,setBusy]=useState(null);

  const ctx=brainCtx(state.documents);

  const createCampaign = async () => {
    if(!goal.trim())return;setBusy("creating");
    try {
      const c=await claudeJSON(MKT_SYS(ctx),`Create a marketing campaign for: "${goal}". Return JSON:{"name":"string","goal":"string","channel":"LinkedIn|Email|Content","targetAudience":"string","message":"string","cta":"string","estimatedLeads":12}`,600);
      const camp={...c,id:uid(),ts:ts(),leadsGenerated:0};
      dispatch({type:"ADD_CAMPAIGN",c:camp});
      dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Lexi",kind:"marketing",text:`Created campaign "${camp.name}" targeting ${camp.targetAudience}`}});
      setGoal("");setTab("campaigns");
      dispatch({type:"NOTIFY",msg:`✓ Campaign "${camp.name}" is live`});setTimeout(()=>dispatch({type:"CLEAR_N"}),3000);
    } catch(e){}
    setBusy(null);
  };

  const genLead = async camp => {
    setBusy(camp.id);
    try {
      const l=await claudeJSON(MKT_SYS(ctx),`You're running campaign "${camp.name}" targeting "${camp.targetAudience}". Generate one realistic qualified lead. Return JSON:{"name":"string","title":"string","company":"string","email":"string","companySize":"string","industry":"string","painPoint":"string","score":78,"source":"${camp.channel}","campaignId":"${camp.id}","campaignName":"${camp.name}"}`,500);
      const lead={...l,id:uid(),status:"new",ts:ts()};
      dispatch({type:"ADD_LEAD",lead});
      dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Lexi",kind:"marketing",text:`Generated lead: ${lead.name} (${lead.title} @ ${lead.company}, score ${lead.score}) → Sales Agent`}});
      dispatch({type:"NOTIFY",msg:`🎯 ${lead.name} → Sales Agent`});setTimeout(()=>dispatch({type:"CLEAR_N"}),3000);
    } catch(e){}
    setBusy(null);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>📣 Marketing Agent — Lexi</div><div style={{fontSize:13,color:T.text3}}>Creates campaigns, generates leads, hands off to Sales Agent automatically.</div></div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(22,196,154,0.08)",border:`1px solid rgba(22,196,154,0.2)`,borderRadius:20,padding:"5px 13px"}}><div style={{width:6,height:6,borderRadius:"50%",background:T.teal,boxShadow:`0 0 5px ${T.teal}`}}/><span style={{fontSize:12,color:T.teal,fontWeight:600}}>Active</span></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:18}}>
        {[{l:"Campaigns",v:state.campaigns.length,c:T.purple2},{l:"Leads Generated",v:state.leads.length,c:T.teal},{l:"Avg Score",v:state.leads.length?Math.round(state.leads.reduce((s,l)=>s+l.score,0)/state.leads.length):"—",c:T.gold},{l:"To Sales",v:state.leads.filter(l=>l.status!=="new").length,c:T.green}].map(k=><Card key={k.l} style={{padding:"13px 15px"}} ch={<><div style={{fontSize:10,color:T.text3,marginBottom:3,letterSpacing:.5}}>{k.l.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,letterSpacing:-1,color:k.c}}>{k.v}</div></>}/>)}
      </div>

      <div style={{display:"flex",gap:4,marginBottom:18}}>
        {[{id:"campaigns",l:"Campaigns"},{id:"create",l:"+ New Campaign"},{id:"leads",l:`Leads (${state.leads.length})`}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 15px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${tab===t.id?"rgba(240,90,68,.4)":T.border}`,background:tab===t.id?"rgba(240,90,68,0.1)":"transparent",color:tab===t.id?T.coral:T.text3}}>{t.l}</button>)}
      </div>

      {tab==="create"&&<Card ch={<>
        <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>New Campaign Goal</div>
        <div style={{fontSize:12,color:T.text3,marginBottom:14}}>Lexi builds the campaign strategy using your Company Brain.</div>
        {state.documents.length===0&&<div style={{background:"rgba(240,184,74,0.08)",border:`1px solid rgba(240,184,74,0.2)`,borderRadius:9,padding:"9px 13px",fontSize:12,color:T.gold,marginBottom:13}}>⚠ No Brain documents. Add some for personalized campaigns.</div>}
        <Inp label="Campaign goal" value={goal} onChange={setGoal} ph="e.g. Generate 20 qualified leads from funded SaaS startups" rows={3}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {["Generate SaaS leads from LinkedIn","Email outreach to Series A founders","Content campaign for e-commerce ops","Cold outreach to CTOs 50-200 employees"].map(ex=><button key={ex} onClick={()=>setGoal(ex)} style={{padding:"3px 9px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,fontSize:11,color:T.text3,cursor:"pointer"}}>{ex}</button>)}
        </div>
        <Btn ch="Create Campaign →" onClick={createCampaign} loading={busy==="creating"} disabled={!goal.trim()}/>
      </>}/>}

      {tab==="campaigns"&&<>
        {state.campaigns.length===0?<EmptyState icon="📣" title="No campaigns yet" sub="Create your first campaign and let Lexi start generating qualified leads." action={()=>setTab("create")} actionLabel="Create first campaign →"/>
        :<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {state.campaigns.map(c=><Card key={c.id} ch={<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
              <div><div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{c.name}</div><div style={{fontSize:12,color:T.text3}}>{c.goal}</div></div>
              <div style={{display:"flex",gap:7}}><Pill ch={c.channel} color={T.teal}/><Pill ch="Active" color={T.green}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
              <div style={{padding:"9px 11px",background:T.bg3,borderRadius:8}}><div style={{fontSize:10,color:T.text3,marginBottom:2}}>TARGET AUDIENCE</div><div style={{fontSize:12,color:T.text2}}>{c.targetAudience}</div></div>
              <div style={{padding:"9px 11px",background:T.bg3,borderRadius:8}}><div style={{fontSize:10,color:T.text3,marginBottom:2}}>CALL TO ACTION</div><div style={{fontSize:12,color:T.text2}}>{c.cta}</div></div>
            </div>
            <div style={{padding:"9px 11px",background:T.bg3,borderRadius:8,marginBottom:12,fontSize:12,color:T.text2,lineHeight:1.6}}><span style={{color:T.text3,fontWeight:600}}>Message: </span>{c.message}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:T.text3}}>Est: <span style={{color:T.gold,fontWeight:600}}>{c.estimatedLeads}</span> leads · Generated: <span style={{color:T.teal,fontWeight:600}}>{state.leads.filter(l=>l.campaignId===c.id).length}</span></span>
              <Btn ch="Generate Lead →" onClick={()=>genLead(c)} loading={busy===c.id} v="outline" style={{fontSize:12,padding:"6px 13px"}}/>
            </div>
          </>}/>)}
        </div>}
      </>}

      {tab==="leads"&&<>
        {state.leads.length===0?<EmptyState icon="🎯" title="No leads yet" sub="Create a campaign and generate leads. They'll appear here and flow to Sales Agent automatically." action={()=>setTab("create")} actionLabel="Create campaign →"/>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.leads.map(l=><Card key={l.id} style={{padding:"13px 17px"}} ch={<div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(240,90,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.coral,flexShrink:0}}>{l.name?.[0]}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{l.name} · {l.title} at {l.company}</div><div style={{fontSize:11,color:T.text3}}>{l.email} · {l.companySize} · via {l.source}</div><div style={{fontSize:11,color:T.text2,marginTop:2}}>Pain: {l.painPoint}</div></div>
            <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:17,fontWeight:700,color:scoreColor(l.score),marginBottom:4}}>{l.score}</div><Pill ch={l.status==="new"?"New":l.status==="contacted"?"Contacted":"In Progress"} color={l.status==="new"?T.gold:l.status==="contacted"?T.green:T.purple2}/></div>
          </div>}/>)}
        </div>}
      </>}
    </div>
  );
}

// ─── SALES AGENT ─────────────────────────────────────────────
const SALES_SYS = ctx => `You are Aria, AI Sales Development Representative for an AI Business Operating System (AI BOS).

COMPANY BRAIN:\n${ctx}

Write personalized outreach that references the specific prospect's situation. Under 130 words. No generic templates. Sound human.`;

function SalesView({state,dispatch}) {
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("all");
  const [busy,setBusy]=useState(null);

  const ctx=brainCtx(state.documents);
  const newLeads=state.leads.filter(l=>l.status==="new");
  const filtered=filter==="all"?state.leads:state.leads.filter(l=>l.status===filter);

  const draft = async lead => {
    setBusy(lead.id);
    const prompt=`Write a cold outreach email for:\nName: ${lead.name}\nTitle: ${lead.title}\nCompany: ${lead.company} (${lead.companySize})\nIndustry: ${lead.industry}\nPain point: ${lead.painPoint}\nSource: ${lead.source} via "${lead.campaignName}"\n\nWrite the email now. Under 130 words.`;
    const text=await claude(SALES_SYS(ctx),prompt,400);
    dispatch({type:"SET_DRAFT",id:lead.id,text});
    dispatch({type:"UPD_LEAD",id:lead.id,u:{status:"drafted"}});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Aria",kind:"sales",text:`Drafted outreach for ${lead.name} (${lead.title} @ ${lead.company})`}});
    setBusy(null);
  };

  const markSent = lead => {
    dispatch({type:"UPD_LEAD",id:lead.id,u:{status:"contacted",contactedTs:ts()}});
    // Auto-create support context when a lead is "contacted" → becomes a customer prospect
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Aria",kind:"sales",text:`Outreach sent to ${lead.name} @ ${lead.company} — lead moved to "Contacted"`}});
    dispatch({type:"NOTIFY",msg:`✓ Outreach sent to ${lead.name}`});setTimeout(()=>dispatch({type:"CLEAR_N"}),2500);
  };

  const convertToCustomer = lead => {
    dispatch({type:"UPD_LEAD",id:lead.id,u:{status:"customer",customerTs:ts()}});
    // Auto-create support ticket context
    const ticket={id:uid(),leadId:lead.id,customerName:lead.name,customerEmail:lead.email,company:lead.company,industry:lead.industry,painPoint:lead.painPoint,campaignName:lead.campaignName,status:"open",priority:"medium",subject:`Onboarding — ${lead.company}`,body:`${lead.name} just converted from the "${lead.campaignName}" campaign. Their key pain point: ${lead.painPoint}. They need onboarding support.`,ts:ts(),source:"sales_handoff"};
    dispatch({type:"ADD_TICKET",t:ticket});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Aria",kind:"sales",text:`${lead.name} @ ${lead.company} converted to customer → Support Agent notified with full context`}});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Marcus",kind:"support",text:`Received customer handoff: ${lead.name} @ ${lead.company} — onboarding ticket created with Sales context`}});
    dispatch({type:"NOTIFY",msg:`🎉 ${lead.name} converted! Support Agent notified.`});setTimeout(()=>dispatch({type:"CLEAR_N"}),3500);
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>📊 Sales Agent — Aria</div><div style={{fontSize:13,color:T.text3}}>Receives leads from Marketing, drafts personalized outreach, hands off to Support on conversion.</div></div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(22,196,154,0.08)",border:`1px solid rgba(22,196,154,0.2)`,borderRadius:20,padding:"5px 13px"}}><div style={{width:6,height:6,borderRadius:"50%",background:T.teal,boxShadow:`0 0 5px ${T.teal}`}}/><span style={{fontSize:12,color:T.teal,fontWeight:600}}>Active</span></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:18}}>
        {[{l:"Total Leads",v:state.leads.length,c:T.purple2},{l:"New",v:newLeads.length,c:T.gold},{l:"Contacted",v:state.leads.filter(l=>l.status==="contacted").length,c:T.teal},{l:"Customers",v:state.leads.filter(l=>l.status==="customer").length,c:T.green}].map(k=><Card key={k.l} style={{padding:"13px 15px"}} ch={<><div style={{fontSize:10,color:T.text3,marginBottom:3,letterSpacing:.5}}>{k.l.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,letterSpacing:-1,color:k.c}}>{k.v}</div></>}/>)}
      </div>

      {newLeads.length>0&&<div style={{background:"rgba(108,99,247,0.07)",border:`1px solid rgba(108,99,247,0.22)`,borderRadius:12,padding:"11px 15px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:7,height:7,borderRadius:"50%",background:T.purple2}}/><span style={{fontSize:13,fontWeight:600,color:T.purple2}}>{newLeads.length} new lead{newLeads.length>1?"s":""} from Marketing Agent waiting for outreach</span></div>
        <Btn ch="Review →" onClick={()=>setSel(newLeads[0])} style={{fontSize:12,padding:"5px 12px"}}/>
      </div>}

      {state.leads.length===0&&<EmptyState icon="📬" title="Waiting for leads" sub="Go to Marketing Agent → create a campaign → generate leads. They appear here automatically."/>}

      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[{id:"all",l:`All (${state.leads.length})`},{id:"new",l:`New (${newLeads.length})`},{id:"drafted",l:"Drafted"},{id:"contacted",l:"Contacted"},{id:"customer",l:"Customers"}].map(t=><button key={t.id} onClick={()=>setFilter(t.id)} style={{padding:"6px 13px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===t.id?"rgba(108,99,247,.4)":T.border}`,background:filter===t.id?"rgba(108,99,247,0.1)":"transparent",color:filter===t.id?T.purple2:T.text3}}>{t.l}</button>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 400px":"1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {filtered.map(l=><Card key={l.id} onClick={()=>setSel(sel?.id===l.id?null:l)} style={{padding:"13px 17px",border:`1px solid ${sel?.id===l.id?"rgba(108,99,247,.4)":T.border}`,background:sel?.id===l.id?"rgba(108,99,247,0.06)":T.bg2}} ch={<div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(108,99,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.purple2,flexShrink:0}}>{l.name?.[0]}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600}}>{l.name} · {l.title}</div><div style={{fontSize:11,color:T.text3}}>{l.company} · {l.companySize}</div></div>
            <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:700,color:scoreColor(l.score)}}>{l.score}</div>
              <Pill ch={l.status==="new"?"New":l.status==="drafted"?"Draft ready":l.status==="customer"?"Customer":"Contacted"} color={l.status==="new"?T.gold:l.status==="contacted"?T.teal:l.status==="customer"?T.green:T.purple2}/>
            </div>
          </div>}/>)}
        </div>

        {sel&&<div style={{position:"sticky",top:0,alignSelf:"start"}}>
          <Card style={{border:`1px solid rgba(108,99,247,.25)`}} ch={<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{sel.name}</div><div style={{fontSize:12,color:T.text3}}>{sel.title} · {sel.company}</div></div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:17}}>✕</button>
            </div>
            {[{l:"Email",v:sel.email},{l:"Company size",v:sel.companySize},{l:"Industry",v:sel.industry},{l:"Source",v:`${sel.source} · ${sel.campaignName}`},{l:"Score",v:`${sel.score}/100`}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.text3}}>{r.l}</span><span style={{color:T.text,fontWeight:500}}>{r.v}</span></div>)}
            <div style={{padding:"8px 0",fontSize:12,borderBottom:`1px solid ${T.border}`,marginBottom:14}}><div style={{color:T.text3,marginBottom:3}}>Pain point</div><div style={{color:T.text2,lineHeight:1.5}}>{sel.painPoint}</div></div>

            <div style={{fontSize:12,fontWeight:600,color:T.purple2,marginBottom:10}}>✍️ Aria's Outreach</div>
            {!state.outreachDrafts[sel.id]&&sel.status==="new"&&<Btn ch="Draft Personalized Email" onClick={()=>draft(sel)} loading={busy===sel.id} style={{width:"100%",justifyContent:"center",marginBottom:10}}/>}
            {state.outreachDrafts[sel.id]&&<>
              <textarea value={state.outreachDrafts[sel.id]} onChange={e=>dispatch({type:"SET_DRAFT",id:sel.id,text:e.target.value})} style={{width:"100%",minHeight:160,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,fontSize:12,lineHeight:1.7,resize:"vertical",outline:"none",fontFamily:"Inter,system-ui,sans-serif",marginBottom:9}}/>
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                {sel.status!=="contacted"&&sel.status!=="customer"&&<Btn ch="✓ Mark Sent" v="teal" onClick={()=>markSent(sel)} style={{flex:1,justifyContent:"center",fontSize:12}}/>}
                <Btn ch="Redraft" v="ghost" onClick={()=>draft(sel)} loading={busy===sel.id} style={{fontSize:12}}/>
              </div>
            </>}
            {(sel.status==="contacted"||sel.status==="drafted")&&sel.status!=="customer"&&<Btn ch="🎉 Convert to Customer →" v="outline" onClick={()=>{convertToCustomer(sel);setSel(null);}} style={{width:"100%",justifyContent:"center",fontSize:12,marginTop:4}}/>}
            {sel.status==="customer"&&<Pill ch="✓ Converted to customer" color={T.green}/>}
          </>}/>
        </div>}
      </div>
    </div>
  );
}

// ─── SUPPORT AGENT ───────────────────────────────────────────
const SUPPORT_SYS = (ctx, customerCtx) => `You are Marcus, AI Customer Support Agent for an AI Business Operating System (AI BOS).

COMPANY BRAIN:\n${ctx}

CUSTOMER CONTEXT (from Sales Agent handoff):\n${customerCtx}

Be empathetic, solution-focused, and thorough. Proactively identify churn risks. Reference the customer's specific situation from the Sales handoff when relevant.`;

function SupportView({state,dispatch}) {
  const [sel,setSel]=useState(null);
  const [replies,setReplies]=useState({});
  const [busy,setBusy]=useState(null);
  const [newTicket,setNewTicket]=useState(false);
  const [nt,setNt]=useState({sub:"",body:"",email:"",name:"",priority:"medium"});

  const ctx=brainCtx(state.documents);

  const draftReply = async ticket => {
    setBusy(ticket.id);
    const custCtx=ticket.source==="sales_handoff"
      ? `This customer came via Sales Agent from campaign "${ticket.campaignName}". Their key pain point was: ${ticket.painPoint}. They recently converted from a lead.`
      : "Direct support inquiry — no prior Sales context.";
    const sys=SUPPORT_SYS(ctx,custCtx);
    const prompt=`Customer: ${ticket.customerName} (${ticket.company||""})\nEmail: ${ticket.customerEmail}\nSubject: ${ticket.subject}\nMessage: ${ticket.body}\n\nWrite a professional, empathetic support reply that resolves this. Reference their specific situation.`;
    const text=await claude(sys,prompt,500);
    setReplies(p=>({...p,[ticket.id]:text}));
    dispatch({type:"UPD_TICKET",id:ticket.id,u:{status:"in_progress"}});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Marcus",kind:"support",text:`Drafted reply for ${ticket.customerName} @ ${ticket.company||ticket.customerEmail} — Ticket: "${ticket.subject}"`}});
    setBusy(null);
  };

  const resolve = ticket => {
    dispatch({type:"UPD_TICKET",id:ticket.id,u:{status:"resolved",resolvedTs:ts()}});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Marcus",kind:"support",text:`Resolved ticket "${ticket.subject}" for ${ticket.customerName}`}});
    dispatch({type:"NOTIFY",msg:`✓ Ticket resolved for ${ticket.customerName}`});setTimeout(()=>dispatch({type:"CLEAR_N"}),2500);
    setSel(null);
  };

  const addTicket = () => {
    if(!nt.sub||!nt.email)return;
    const t={id:uid(),customerName:nt.name||nt.email,customerEmail:nt.email,company:"",subject:nt.sub,body:nt.body,status:"open",priority:nt.priority,ts:ts(),source:"manual"};
    dispatch({type:"ADD_TICKET",t});
    dispatch({type:"ADD_EVENT",ev:{id:uid(),ts:ts(),agent:"Marcus",kind:"support",text:`New ticket received: "${nt.sub}" from ${nt.name||nt.email}`}});
    setNt({sub:"",body:"",email:"",name:"",priority:"medium"});setNewTicket(false);
    dispatch({type:"NOTIFY",msg:`Ticket created — Marcus will draft a reply`});setTimeout(()=>dispatch({type:"CLEAR_N"}),2500);
  };

  const statusColor={open:T.gold,"in_progress":T.purple2,resolved:T.green};
  const prioColor={high:T.coral,medium:T.gold,low:T.teal};

  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>🎧 Support Agent — Marcus</div><div style={{fontSize:13,color:T.text3}}>Receives Sales handoffs with full customer context. Handles tickets with personalized responses.</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(22,196,154,0.08)",border:`1px solid rgba(22,196,154,0.2)`,borderRadius:20,padding:"5px 13px"}}><div style={{width:6,height:6,borderRadius:"50%",background:T.teal,boxShadow:`0 0 5px ${T.teal}`}}/><span style={{fontSize:12,color:T.teal,fontWeight:600}}>Active</span></div>
          <Btn ch="+ New Ticket" v="ghost" onClick={()=>setNewTicket(true)} style={{fontSize:12,padding:"6px 13px"}}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:18}}>
        {[{l:"Total Tickets",v:state.tickets.length,c:T.purple2},{l:"Open",v:state.tickets.filter(t=>t.status==="open").length,c:T.gold},{l:"In Progress",v:state.tickets.filter(t=>t.status==="in_progress").length,c:T.purple2},{l:"Resolved",v:state.tickets.filter(t=>t.status==="resolved").length,c:T.green}].map(k=><Card key={k.l} style={{padding:"13px 15px"}} ch={<><div style={{fontSize:10,color:T.text3,marginBottom:3,letterSpacing:.5}}>{k.l.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,letterSpacing:-1,color:k.c}}>{k.v}</div></>}/>)}
      </div>

      {/* Sales handoff highlight */}
      {state.tickets.filter(t=>t.source==="sales_handoff"&&t.status==="open").length>0&&<div style={{background:"rgba(22,196,154,0.06)",border:`1px solid rgba(22,196,154,0.2)`,borderRadius:12,padding:"11px 15px",marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:600,color:T.teal,marginBottom:4}}>🤝 Sales Agent Handoffs</div>
        <div style={{fontSize:12,color:T.text2}}>{state.tickets.filter(t=>t.source==="sales_handoff"&&t.status==="open").length} ticket{state.tickets.filter(t=>t.source==="sales_handoff"&&t.status==="open").length>1?"s":""} from Sales — customer context pre-loaded from conversion</div>
      </div>}

      {newTicket&&<Card style={{marginBottom:16,border:`1px solid rgba(108,99,247,.25)`}} ch={<>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14,color:T.purple2}}>New Support Ticket</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Inp label="Customer name" value={nt.name} onChange={v=>setNt(p=>({...p,name:v}))} ph="Jane Smith"/>
          <Inp label="Customer email *" value={nt.email} onChange={v=>setNt(p=>({...p,email:v}))} ph="jane@company.com"/>
        </div>
        <Inp label="Subject *" value={nt.sub} onChange={v=>setNt(p=>({...p,sub:v}))} ph="e.g. Can't connect CRM integration"/>
        <Inp label="Description" value={nt.body} onChange={v=>setNt(p=>({...p,body:v}))} ph="Describe the issue…" rows={3}/>
        <div style={{display:"flex",gap:9,alignItems:"center"}}>
          <select value={nt.priority} onChange={e=>setNt(p=>({...p,priority:e.target.value}))} style={{padding:"8px 12px",background:T.bg3,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text2,fontSize:13,outline:"none"}}>
            <option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option>
          </select>
          <Btn ch="Create Ticket" onClick={addTicket} disabled={!nt.sub||!nt.email}/>
          <Btn ch="Cancel" v="ghost" onClick={()=>setNewTicket(false)}/>
        </div>
      </>}/>}

      {state.tickets.length===0&&<EmptyState icon="🎧" title="No tickets yet" sub="Tickets appear here automatically when Sales Agent converts a lead, or create one manually." action={()=>setNewTicket(true)} actionLabel="Create first ticket"/>}

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 420px":"1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {state.tickets.map(t=><Card key={t.id} onClick={()=>setSel(sel?.id===t.id?null:t)} style={{padding:"13px 17px",border:`1px solid ${sel?.id===t.id?"rgba(108,99,247,.4)":T.border}`,background:sel?.id===t.id?"rgba(108,99,247,0.06)":T.bg2}} ch={<div style={{display:"flex",alignItems:"flex-start",gap:11}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(22,196,154,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.teal,flexShrink:0,marginTop:1}}>{t.customerName?.[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{t.subject}</div>
              <div style={{fontSize:11,color:T.text3}}>{t.customerName} · {t.customerEmail}</div>
              {t.source==="sales_handoff"&&<div style={{fontSize:10,color:T.teal,marginTop:3}}>🤝 Sales handoff — context loaded</div>}
            </div>
            <div style={{display:"flex",gap:7,flexShrink:0,flexDirection:"column",alignItems:"flex-end"}}>
              <Pill ch={t.status.replace("_"," ")} color={statusColor[t.status]||T.text2}/>
              <Pill ch={t.priority} color={prioColor[t.priority]||T.text3}/>
            </div>
          </div>}/>)}
        </div>

        {sel&&<div style={{position:"sticky",top:0,alignSelf:"start"}}>
          <Card style={{border:`1px solid rgba(22,196,154,.25)`}} ch={<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{sel.subject}</div><div style={{fontSize:12,color:T.text3}}>{sel.customerName} · {sel.customerEmail}</div></div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:17}}>✕</button>
            </div>

            {sel.source==="sales_handoff"&&<div style={{background:"rgba(22,196,154,0.08)",border:`1px solid rgba(22,196,154,0.2)`,borderRadius:9,padding:"10px 13px",marginBottom:13}}>
              <div style={{fontSize:11,color:T.teal,fontWeight:600,marginBottom:5}}>🤝 SALES CONTEXT (from Aria)</div>
              <div style={{fontSize:12,color:T.text2,lineHeight:1.6}}>Campaign: <span style={{color:T.text}}>{sel.campaignName}</span></div>
              <div style={{fontSize:12,color:T.text2,lineHeight:1.6}}>Pain point: <span style={{color:T.text}}>{sel.painPoint}</span></div>
            </div>}

            <div style={{padding:"9px 12px",background:T.bg3,borderRadius:9,marginBottom:14}}>
              <div style={{fontSize:11,color:T.text3,marginBottom:5}}>CUSTOMER MESSAGE</div>
              <div style={{fontSize:13,color:T.text2,lineHeight:1.6}}>{sel.body}</div>
            </div>

            <div style={{fontSize:12,fontWeight:600,color:T.teal,marginBottom:10}}>🎧 Marcus's Reply</div>
            {!replies[sel.id]&&sel.status!=="resolved"&&<Btn ch="Draft Reply with Context" v="teal" onClick={()=>draftReply(sel)} loading={busy===sel.id} style={{width:"100%",justifyContent:"center",marginBottom:10}}/>}
            {replies[sel.id]&&<>
              <textarea value={replies[sel.id]} onChange={e=>setReplies(p=>({...p,[sel.id]:e.target.value}))} style={{width:"100%",minHeight:160,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,fontSize:12,lineHeight:1.7,resize:"vertical",outline:"none",fontFamily:"Inter,system-ui,sans-serif",marginBottom:9}}/>
              <div style={{display:"flex",gap:7}}>
                {sel.status!=="resolved"&&<Btn ch="✓ Send & Resolve" v="teal" onClick={()=>resolve(sel)} style={{flex:1,justifyContent:"center",fontSize:12}}/>}
                <Btn ch="Redraft" v="ghost" onClick={()=>draftReply(sel)} loading={busy===sel.id} style={{fontSize:12}}/>
              </div>
            </>}
            {sel.status==="resolved"&&<Pill ch="✓ Resolved" color={T.green}/>}
          </>}/>
        </div>}
      </div>
    </div>
  );
}

// ─── COLLABORATION FEED ──────────────────────────────────────
function CollabView({state}) {
  const kindCfg={brain:{color:T.purple2,icon:"🧠",label:"Brain"},marketing:{color:T.coral,icon:"📣",label:"Marketing"},sales:{color:T.purple,icon:"📊",label:"Sales"},support:{color:T.teal,icon:"🎧",label:"Support"}};

  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{marginBottom:22}}><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>⚡ Collaboration Feed</div><div style={{fontSize:13,color:T.text3}}>Real-time log of every agent action and cross-agent handoff.</div></div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:20}}>
        {[{l:"Brain Docs",v:state.documents.length,c:T.purple2,i:"🧠"},{l:"Leads Generated",v:state.leads.length,c:T.coral,i:"📣"},{l:"Outreach Sent",v:state.leads.filter(l=>l.status!=="new").length,c:T.gold,i:"📊"},{l:"Tickets Resolved",v:state.tickets.filter(t=>t.status==="resolved").length,c:T.green,i:"🎧"}].map(k=><Card key={k.l} style={{padding:"13px 15px"}} ch={<><div style={{fontSize:20,marginBottom:7}}>{k.i}</div><div style={{fontSize:10,color:T.text3,marginBottom:3,letterSpacing:.5}}>{k.l.toUpperCase()}</div><div style={{fontSize:22,fontWeight:800,letterSpacing:-1,color:k.c}}>{k.v}</div></>}/>)}
      </div>

      {state.leads.length>0&&<Card style={{marginBottom:18}} ch={<>
        <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Pipeline Flow</div>
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          {[{l:"Brain",v:state.documents.length>0?"Ready":"Empty",c:T.purple2},{l:"Campaigns",v:state.campaigns.length,c:T.coral},{l:"Leads",v:state.leads.length,c:T.gold},{l:"Contacted",v:state.leads.filter(l=>l.status!=="new").length,c:T.teal},{l:"Customers",v:state.leads.filter(l=>l.status==="customer").length,c:T.green},{l:"Tickets",v:state.tickets.length,c:T.purple2}].map((s,i,arr)=><>
            <div key={s.l} style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:s.l==="Brain"?14:22,fontWeight:700,color:s.c,marginBottom:3}}>{s.v}</div>
              <div style={{fontSize:10,color:T.text3}}>{s.l}</div>
            </div>
            {i<arr.length-1&&<div key={i+"a"} style={{fontSize:14,color:T.border2,padding:"0 2px"}}>→</div>}
          </>)}
        </div>
      </>}/>}

      {state.events.length===0?<EmptyState icon="🤝" title="No activity yet" sub="Start by adding documents to Company Brain, then create a campaign in Marketing Agent. Every agent action appears here."/>
      :<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {state.events.map(ev=>{const cfg=kindCfg[ev.kind]||kindCfg.brain;return(
          <div key={ev.id} style={{display:"flex",gap:11,padding:"11px 15px",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:12,alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`${cfg.color}1a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{cfg.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:12,color:T.text,lineHeight:1.5}}><span style={{fontWeight:700,color:cfg.color}}>{ev.agent}</span> {ev.text}</div><div style={{fontSize:10,color:T.text3,marginTop:2}}>{fmtT(ev.ts)}</div></div>
            <Pill ch={cfg.label} color={cfg.color}/>
          </div>
        );})}
      </div>}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────
function SettingsView({state,dispatch}) {
  const [saved,setSaved]=useState(false);
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  return (
    <div style={{flex:1,overflow:"auto",padding:26,background:T.bg}}>
      <div style={{marginBottom:22}}><div style={{fontSize:21,fontWeight:800,letterSpacing:-.5,marginBottom:3}}>⚙️ Settings</div><div style={{fontSize:13,color:T.text3}}>Manage your workspace, agents, and preferences.</div></div>
      <div style={{maxWidth:520}}>
        <Card style={{marginBottom:14}} ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Organization</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,fontSize:13}}><span style={{color:T.text3}}>Company</span><span style={{color:T.text,fontWeight:500}}>{state.org?.name}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,fontSize:13}}><span style={{color:T.text3}}>Plan</span><Pill ch="Growth — 3 Agents" color={T.teal}/></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:13}}><span style={{color:T.text3}}>Account</span><span style={{color:T.text2}}>{state.user?.email}</span></div>
        </>}/>
        <Card style={{marginBottom:14}} ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Agent Autonomy</div>
          {[{n:"Lexi (Marketing)",d:"Campaign creation, lead generation"},{n:"Aria (Sales)",d:"Outreach drafting, pipeline management"},{n:"Marcus (Support)",d:"Ticket responses, customer context"}].map(a=><div key={a.n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
            <div><div style={{fontSize:13,fontWeight:500}}>{a.n}</div><div style={{fontSize:11,color:T.text3}}>{a.d}</div></div>
            <select defaultValue="supervised" style={{padding:"5px 10px",background:T.bg3,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text2,fontSize:12,outline:"none"}}>
              <option value="copilot">Co-pilot</option><option value="supervised">Supervised</option><option value="autonomous">Autonomous</option>
            </select>
          </div>)}
        </>}/>
        <Card style={{marginBottom:14}} ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Data</div>
          <div style={{fontSize:12,color:T.text3,marginBottom:14}}>{state.documents.length} documents · {state.leads.length} leads · {state.campaigns.length} campaigns · {state.tickets.length} tickets · {state.events.length} events</div>
          <div style={{fontSize:11,color:T.text3,marginBottom:14}}>Data is persisted automatically across sessions.</div>
          <Btn ch="Save Settings" onClick={save}>{saved?"✓ Saved":null}</Btn>
        </>}/>
        <Card ch={<>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Account</div>
          <Btn ch="Sign out" v="danger" onClick={()=>dispatch({type:"SIGNOUT"})}/>
        </>}/>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initState);
  const [hydrated,setHydrated]=useState(false);

  useEffect(()=>{
    restore().then(saved=>{
      if(saved?.user){dispatch({type:"HYDRATE",state:saved});}
      setHydrated(true);
    });
  },[]);

  if(!hydrated) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#08080e",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div style={{width:40,height:40,background:"linear-gradient(135deg,#6c5ff7,#16c49a)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}}>B</div>
        <Spin sz={20} c="#6c5ff7"/>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:"#08080e",fontFamily:"Inter,system-ui,sans-serif",color:"#f0f0fa",overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input,select,textarea{font-family:Inter,system-ui,sans-serif;color:#f0f0fa}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}`}</style>

      {state.view==="auth"?<AuthView dispatch={dispatch}/>:<>
        <Sidebar state={state} dispatch={dispatch}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Topbar state={state}/>
          <div style={{flex:1,overflow:"hidden",display:"flex"}}>
            {state.activeNav==="brain"     &&<BrainView     state={state} dispatch={dispatch}/>}
            {state.activeNav==="marketing" &&<MarketingView state={state} dispatch={dispatch}/>}
            {state.activeNav==="sales"     &&<SalesView     state={state} dispatch={dispatch}/>}
            {state.activeNav==="support"   &&<SupportView   state={state} dispatch={dispatch}/>}
            {state.activeNav==="collab"    &&<CollabView    state={state}/>}
            {state.activeNav==="settings"  &&<SettingsView  state={state} dispatch={dispatch}/>}
          </div>
        </div>
        {state.notification&&<div style={{position:"fixed",bottom:22,right:22,background:T.bg3,border:`1px solid ${T.border2}`,borderRadius:12,padding:"11px 17px",fontSize:13,fontWeight:500,color:T.text,boxShadow:"0 8px 30px rgba(0,0,0,0.45)",zIndex:1000}}>{state.notification}</div>}
      </>}
    </div>
  );
}
