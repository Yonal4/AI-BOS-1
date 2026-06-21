import { useState, useEffect, useRef } from "react";

// ─── THEME ───────────────────────────────────────────────────
const C = {
  bg:"#0a0a0f", bg2:"#0d0d14", bg3:"#111118", bg4:"#16161f",
  border:"rgba(255,255,255,0.06)", border2:"rgba(255,255,255,0.1)",
  text:"#f0f0f8", text2:"#9b9bb8", text3:"#6b6b88",
  purple:"#7c6dfa", purple2:"#a594ff",
  teal:"#22d3b0", coral:"#f06a40", gold:"#facc4b",
  grad:"linear-gradient(135deg,#7c6dfa 0%,#22d3b0 100%)",
};

const AGENTS = [
  { id:"aria",   name:"Aria",   role:"Sales SDR",    emoji:"📊", color:"#7c6dfa", bg:"rgba(124,109,250,0.15)", dept:"sales" },
  { id:"marcus", name:"Marcus", role:"Support",       emoji:"🎧", color:"#22d3b0", bg:"rgba(34,211,176,0.15)",  dept:"support" },
  { id:"lexi",   name:"Lexi",   role:"Marketing",     emoji:"📣", color:"#f06a40", bg:"rgba(240,106,64,0.15)",  dept:"marketing" },
  { id:"felix",  name:"Felix",  role:"Finance",       emoji:"💰", color:"#facc4b", bg:"rgba(250,204,75,0.15)",  dept:"finance" },
  { id:"nova",   name:"Nova",   role:"Operations",    emoji:"⚙️", color:"#63c8c8", bg:"rgba(99,200,200,0.15)", dept:"ops" },
];

// ─── TINY COMPONENTS ─────────────────────────────────────────
const Pill = ({children, color=C.purple2, bg="rgba(124,109,250,0.12)"}) => (
  <span style={{padding:"2px 10px",borderRadius:20,background:bg,color,fontSize:11,fontWeight:600}}>{children}</span>
);

const Card = ({children, style={}}) => (
  <div style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"18px 20px",...style}}>{children}</div>
);

const Btn = ({children, onClick, variant="primary", style={}, disabled=false}) => {
  const base = {padding:"9px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",transition:".15s",...style};
  const vars = {
    primary:{background:C.purple,color:"#fff"},
    ghost:{background:"rgba(255,255,255,0.05)",color:C.text2,border:`0.5px solid ${C.border2}`},
    teal:{background:C.teal,color:"#fff"},
    danger:{background:"rgba(240,106,64,0.15)",color:C.coral,border:`0.5px solid rgba(240,106,64,0.3)`},
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...vars[variant]}}>{children}</button>;
};

const Spinner = ({size=14,color="#fff"}) => (
  <span style={{display:"inline-block",width:size,height:size,border:`2px solid rgba(255,255,255,0.2)`,borderTopColor:color,borderRadius:"50%",animation:"spin .7s linear infinite"}} />
);

// ─── SIDEBAR ─────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",  icon:"⬛", label:"Dashboard"},
  {id:"command",    icon:"⚡", label:"Command Center"},
  {id:"workforce",  icon:"🤖", label:"AI Workforce"},
  {id:"brain",      icon:"🧠", label:"Company Brain"},
  {id:"marketplace",icon:"🏪", label:"Marketplace"},
  {id:"onboarding", icon:"🚀", label:"Setup Wizard"},
];

function Sidebar({view, setView, onboarded}) {
  return (
    <div style={{width:210,background:C.bg2,borderRight:`0.5px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,padding:"0 10px"}}>
      <div style={{padding:"16px 6px 14px",display:"flex",alignItems:"center",gap:9,borderBottom:`0.5px solid ${C.border}`,marginBottom:10}}>
        <div style={{width:28,height:28,background:C.grad,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>B</div>
        <span style={{fontWeight:700,fontSize:15,letterSpacing:-.3}}>AI BOS</span>
        <Pill color={C.teal} bg="rgba(34,211,176,0.12)">Beta</Pill>
      </div>
      {NAV.map(n => (
        <div key={n.id} onClick={()=>setView(n.id)} style={{
          display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,cursor:"pointer",marginBottom:3,
          background:view===n.id?"rgba(124,109,250,0.12)":"transparent",
          color:view===n.id?C.purple2:C.text3,fontSize:13,fontWeight:view===n.id?600:400,
          border:view===n.id?`0.5px solid rgba(124,109,250,0.25)`:"0.5px solid transparent",
        }}>
          <span style={{fontSize:14}}>{n.icon}</span>{n.label}
          {n.id==="command" && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.teal,boxShadow:`0 0 6px ${C.teal}`}} />}
          {n.id==="onboarding" && !onboarded && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.gold}} />}
        </div>
      ))}
      <div style={{marginTop:"auto",padding:"12px 6px",borderTop:`0.5px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.text3,marginBottom:6}}>Company Brain</div>
        <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:4}}>
          <div style={{height:"100%",width:"74%",background:C.grad,borderRadius:4}} />
        </div>
        <div style={{fontSize:10,color:C.text3,marginTop:4}}>74% complete</div>
      </div>
    </div>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────
function Topbar({metrics}) {
  return (
    <div style={{height:50,background:C.bg2,borderBottom:`0.5px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:24,flexShrink:0}}>
      {[
        {label:"MRR",val:"$47.2K",color:C.teal},
        {label:"Emails sent",val:metrics.emails,color:C.purple2},
        {label:"Tickets resolved",val:metrics.tickets,color:C.coral},
        {label:"Meetings",val:metrics.meetings,color:C.gold},
      ].map(m=>(
        <div key={m.label} style={{fontSize:12}}>
          <span style={{color:C.text3,marginRight:6}}>{m.label}</span>
          <span style={{fontWeight:700,color:m.color}}>{m.val}</span>
        </div>
      ))}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:C.teal,boxShadow:`0 0 8px ${C.teal}`}} />
        <span style={{fontSize:12,color:C.teal}}>All agents online</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 1. DASHBOARD
// ══════════════════════════════════════════════
const MRR_DATA = [
  {m:"Jan",v:18},{m:"Feb",v:22},{m:"Mar",v:27},{m:"Apr",v:31},{m:"May",v:38},{m:"Jun",v:47},
];

function MiniChart({data}) {
  const max = Math.max(...data.map(d=>d.v));
  const w=260,h=70,pad=10;
  const pts = data.map((d,i)=>{
    const x = pad + (i/(data.length-1))*(w-pad*2);
    const y = h - pad - ((d.v/max)*(h-pad*2));
    return `${x},${y}`;
  }).join(" ");
  const area = `${pad},${h-pad} ` + pts + ` ${w-pad},${h-pad}`;
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c6dfa" stopOpacity=".35"/>
          <stop offset="100%" stopColor="#7c6dfa" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#cg)" />
      <polyline points={pts} fill="none" stroke="#7c6dfa" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d,i)=>{
        const x=pad+(i/(data.length-1))*(w-pad*2);
        const y=h-pad-((d.v/max)*(h-pad*2));
        return <circle key={i} cx={x} cy={y} r={i===data.length-1?4:2} fill={i===data.length-1?"#22d3b0":"#7c6dfa"} />;
      })}
    </svg>
  );
}

const ACTIVITY_FEED = [
  {agent:"aria",  emoji:"📊", color:"#7c6dfa", text:"Sent 14 personalized outreach emails to ICP leads", time:"2 min ago",  badge:"executed"},
  {agent:"marcus",emoji:"🎧", color:"#22d3b0", text:"Resolved 5 tickets autonomously, escalated 1",      time:"8 min ago",  badge:"executed"},
  {agent:"lexi",  emoji:"📣", color:"#f06a40", text:"Published LinkedIn post, 847 impressions so far",   time:"23 min ago", badge:"executed"},
  {agent:"nova",  emoji:"⚙️", color:"#63c8c8", text:"Coordinated deal handoff for Nexus AI ($1,999/mo)", time:"1 hr ago",   badge:"executed"},
  {agent:"felix", emoji:"💰", color:"#facc4b", text:"Flagged 18% API cost increase — report ready",      time:"2 hr ago",   badge:"review"},
];

function Dashboard() {
  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>Operations Dashboard</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Sunday, June 14, 2026 · AI workforce summary</div>
      </div>

      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Monthly Recurring Revenue",val:"$47,200",sub:"↑ $8,100 this month",color:C.teal},
          {label:"New Customers",val:"23",sub:"↑ 4 this week",color:C.purple2},
          {label:"Churn this month",val:"3",sub:"$2,400 lost MRR",color:C.coral},
          {label:"Autonomy Rate",val:"74%",sub:"↑ 6% vs last month",color:C.gold},
        ].map(k=>(
          <Card key={k.label}>
            <div style={{fontSize:11,color:C.text3,marginBottom:6,letterSpacing:.4}}>{k.label.toUpperCase()}</div>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:-1,color:k.color}}>{k.val}</div>
            <div style={{fontSize:11,color:C.teal,marginTop:4}}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Chart + Agents */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>MRR Growth</div>
              <div style={{fontSize:11,color:C.text3}}>Last 6 months</div>
            </div>
            <Pill color={C.teal} bg="rgba(34,211,176,0.1)">↑ 22% MoM</Pill>
          </div>
          <MiniChart data={MRR_DATA} />
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            {MRR_DATA.map(d=><span key={d.m} style={{fontSize:10,color:C.text3}}>{d.m}</span>)}
          </div>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Agent Health</div>
          {AGENTS.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:16}}>{a.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:500,color:a.color}}>{a.name}</span>
                  <span style={{fontSize:11,color:C.text3}}>{Math.floor(70+Math.random()*25)}% autonomous</span>
                </div>
                <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                  <div style={{height:"100%",width:`${70+Math.floor(Math.random()*25)}%`,background:a.color,borderRadius:3,opacity:.8}} />
                </div>
              </div>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.teal,boxShadow:`0 0 5px ${C.teal}`}} />
            </div>
          ))}
        </Card>
      </div>

      {/* Activity + Tasks */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Live Activity Feed</div>
          {ACTIVITY_FEED.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:`${item.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{item.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:C.text2,lineHeight:1.5}}><span style={{fontWeight:600,color:item.color}}>{item.agent.charAt(0).toUpperCase()+item.agent.slice(1)}</span> {item.text}</div>
                <div style={{fontSize:10,color:C.text3,marginTop:2}}>{item.time}</div>
              </div>
              <Pill color={item.badge==="executed"?C.teal:C.gold} bg={item.badge==="executed"?"rgba(34,211,176,0.1)":"rgba(250,204,75,0.1)"}>{item.badge}</Pill>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Pending Approvals</div>
          {[
            {agent:"aria",  emoji:"📊", text:"Send cold email to CEO of Stripe", confidence:62},
            {agent:"lexi",  emoji:"📣", text:"Launch $2,000 LinkedIn ad campaign", confidence:71},
          ].map((ap,i)=>(
            <div key={i} style={{background:"rgba(250,204,75,0.06)",border:"0.5px solid rgba(250,204,75,0.2)",borderRadius:10,padding:"12px",marginBottom:10}}>
              <div style={{fontSize:12,marginBottom:6}}><span style={{fontWeight:600}}>{ap.emoji} {ap.agent}</span><br/><span style={{color:C.text2}}>{ap.text}</span></div>
              <div style={{fontSize:11,color:C.text3,marginBottom:8}}>Confidence: <span style={{color:C.gold}}>{ap.confidence}%</span></div>
              <div style={{display:"flex",gap:6}}>
                <button style={{flex:1,padding:"5px 0",background:"rgba(34,211,176,0.12)",border:"0.5px solid rgba(34,211,176,0.3)",borderRadius:6,color:C.teal,fontSize:11,cursor:"pointer"}}>✓ Approve</button>
                <button style={{flex:1,padding:"5px 0",background:"rgba(240,106,64,0.1)",border:"0.5px solid rgba(240,106,64,0.25)",borderRadius:6,color:C.coral,fontSize:11,cursor:"pointer"}}>✕ Reject</button>
              </div>
            </div>
          ))}
          <div style={{fontSize:13,fontWeight:600,margin:"14px 0 10px"}}>Quick Stats</div>
          {[
            {label:"Emails sent today",val:"287",color:C.purple2},
            {label:"Meetings booked",val:"14",color:C.teal},
            {label:"Leads in pipeline",val:"142",color:C.gold},
            {label:"Open tickets",val:"7",color:C.coral},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.text2}}>{s.label}</span>
              <span style={{fontSize:14,fontWeight:700,color:s.color}}>{s.val}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 2. AI COMMAND CENTER
// ══════════════════════════════════════════════
const CMD_EXAMPLES = [
  "Increase revenue by 20% this quarter",
  "Handle the surge in support tickets this week",
  "Launch a campaign for our new Company Brain feature",
  "Close the 5 deals stuck in proposal stage",
  "Reduce churn — 3 customers are at risk",
];

const CMD_SYSTEM = `You are the AI BOS Command Intelligence — the central brain of an AI Business Operating System.

When given a business goal, you create a detailed, structured cross-department execution plan assigning specific tasks to each AI employee:
- Aria (Sales SDR): outreach, lead follow-up, CRM updates, deal closing
- Marcus (Support): ticket management, churn prevention, customer success
- Lexi (Marketing): campaigns, content, email sequences, social posts
- Felix (Finance): reporting, forecasting, cost analysis, alerts
- Nova (Operations): coordination, workflows, project management, handoffs

COMPANY CONTEXT:
- Product: AI BOS — AI Business Operating System
- Plans: Starter $299/mo, Growth $799/mo, Team $1,999/mo
- Current MRR: $47,200 | Customers: 200+ | Churn: 3 this month
- ICP: Funded startups 5–200 employees, SaaS/ecom/agencies

Respond ONLY with valid JSON (no markdown, no preamble):
{
  "goal": "restate the goal clearly",
  "summary": "2-sentence executive summary of the plan",
  "timeline": "e.g. 2 weeks",
  "expectedImpact": "quantified expected outcome",
  "tasks": [
    {
      "agentId": "aria|marcus|lexi|felix|nova",
      "priority": "critical|high|medium",
      "title": "short task title",
      "description": "detailed what and why",
      "actions": ["specific action 1", "specific action 2", "specific action 3"],
      "kpi": "how success is measured",
      "timeframe": "e.g. 48 hours"
    }
  ]
}`;

function CommandCenter() {
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [err, setErr] = useState("");
  const [executed, setExecuted] = useState({});
  const ref = useRef();

  const run = async () => {
    if (!cmd.trim() || loading) return;
    setLoading(true); setPlan(null); setErr(""); setExecuted({});
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1500,
          system: CMD_SYSTEM,
          messages:[{role:"user",content:cmd}],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      setPlan(JSON.parse(clean));
    } catch(e) { setErr("Failed to generate plan. Try again."); }
    finally { setLoading(false); }
  };

  const prioColor = p => p==="critical"?C.coral:p==="high"?C.gold:C.teal;

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>⚡ AI Command Center</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Type any business goal. Your AI workforce executes it.</div>
      </div>

      {/* Input */}
      <Card style={{marginBottom:20,background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.25)`}}>
        <div style={{fontSize:11,color:C.purple2,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Command</div>
        <textarea ref={ref} value={cmd} onChange={e=>setCmd(e.target.value)}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")run();}}
          placeholder="e.g. Increase revenue by 20% this quarter..."
          style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,lineHeight:1.6,resize:"none",minHeight:72,outline:"none",fontFamily:"inherit"}}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CMD_EXAMPLES.slice(0,3).map((ex,i)=>(
              <button key={i} onClick={()=>setCmd(ex)} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border}`,borderRadius:20,fontSize:11,color:C.text3,cursor:"pointer"}}>
                {ex.length>32?ex.slice(0,32)+"…":ex}
              </button>
            ))}
          </div>
          <Btn onClick={run} disabled={loading} style={{minWidth:140,display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
            {loading?<><Spinner />Generating…</>:"⚡ Execute Plan"}
          </Btn>
        </div>
      </Card>

      {err && <div style={{color:C.coral,fontSize:13,marginBottom:16}}>{err}</div>}

      {/* Loading */}
      {loading && (
        <Card>
          {["Analyzing goal across all departments…","Querying Company Brain for context…","Assigning tasks to each AI employee…","Building execution timeline…"].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,color:C.text3,fontSize:13,marginBottom:10}}>
              <Spinner size={12} color={C.purple} />{t}
            </div>
          ))}
        </Card>
      )}

      {/* Plan */}
      {plan && (
        <div>
          {/* Summary */}
          <Card style={{marginBottom:16,background:"rgba(124,109,250,0.07)",border:`0.5px solid rgba(124,109,250,0.3)`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:6,letterSpacing:-.3}}>{plan.goal}</div>
                <div style={{fontSize:13,color:C.text2,lineHeight:1.6}}>{plan.summary}</div>
              </div>
              <div style={{display:"flex",gap:10,flexShrink:0}}>
                <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(34,211,176,0.1)",borderRadius:8}}>
                  <div style={{fontSize:11,color:C.text3}}>Timeline</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.teal}}>{plan.timeline}</div>
                </div>
                <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(124,109,250,0.1)",borderRadius:8}}>
                  <div style={{fontSize:11,color:C.text3}}>Expected Impact</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.purple2}}>{plan.expectedImpact}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tasks */}
          <div style={{fontSize:11,color:C.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>Execution Plan — {plan.tasks?.length} agent tasks</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {plan.tasks?.map((task,i)=>{
              const agent = AGENTS.find(a=>a.id===task.agentId)||AGENTS[0];
              const done = executed[i];
              return (
                <Card key={i} style={{border:`0.5px solid ${agent.color}30`,background:done?"rgba(34,211,176,0.04)":C.bg2}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:agent.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{agent.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                        <span style={{fontWeight:700,color:agent.color,fontSize:14}}>{agent.name}</span>
                        <Pill color={prioColor(task.priority)} bg={`${prioColor(task.priority)}18`}>{task.priority}</Pill>
                        <span style={{fontSize:12,color:C.text3}}>⏱ {task.timeframe}</span>
                        {done && <Pill color={C.teal} bg="rgba(34,211,176,0.12)">✓ Deployed</Pill>}
                      </div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{task.title}</div>
                      <div style={{fontSize:13,color:C.text2,marginBottom:10,lineHeight:1.6}}>{task.description}</div>
                      <div style={{marginBottom:10}}>
                        {task.actions?.map((a,j)=>(
                          <div key={j} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.text2,marginBottom:4}}>
                            <span style={{color:agent.color,fontWeight:700}}>→</span>{a}
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.text3}}>KPI: <span style={{color:C.gold}}>{task.kpi}</span></span>
                        {!done
                          ? <Btn onClick={()=>setExecuted(e=>({...e,[i]:true}))} variant="ghost" style={{fontSize:12,padding:"5px 14px"}}>Deploy {agent.name} →</Btn>
                          : <span style={{fontSize:12,color:C.teal}}>✓ Agent deployed</span>
                        }
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {Object.keys(executed).length===plan.tasks?.length && plan.tasks?.length>0 && (
            <Card style={{marginTop:16,textAlign:"center",background:"rgba(34,211,176,0.06)",border:`0.5px solid rgba(34,211,176,0.25)`}}>
              <div style={{fontSize:28,marginBottom:8}}>🚀</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>All agents deployed</div>
              <div style={{fontSize:13,color:C.text2}}>Your AI workforce is now executing this plan autonomously. Check the Activity Feed for live updates.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// 3. AGENT MARKETPLACE
// ══════════════════════════════════════════════
const MARKET_CATS = ["All","Sales","Support","Marketing","Finance","HR","Industry","Community"];

const MARKET_AGENTS = [
  {id:"re",    name:"RealtyAI",    cat:"Industry", emoji:"🏠", color:"#7c6dfa", desc:"Handles property listings, client follow-ups, open house scheduling, and CRM updates for real estate agencies.", rating:4.9, installs:"1.2K", price:"$199/mo", tags:["Lead Gen","CRM","Scheduling"]},
  {id:"dental",name:"DentalBot",   cat:"Industry", emoji:"🦷", color:"#22d3b0", desc:"Appointment reminders, recall campaigns, insurance follow-ups, and patient satisfaction surveys for dental practices.", rating:4.8, installs:"890",  price:"$149/mo", tags:["Appointments","Recalls","Billing"]},
  {id:"legal", name:"LexAI",       cat:"Industry", emoji:"⚖️", color:"#f06a40", desc:"Client intake, document drafting, deadline tracking, and billing management for law firms.", rating:4.7, installs:"540",  price:"$299/mo", tags:["Intake","Docs","Billing"]},
  {id:"rest",  name:"TableTurn",   cat:"Industry", emoji:"🍽️", color:"#facc4b", desc:"Reservation management, review responses, delivery coordination, and staff scheduling for restaurants.", rating:4.6, installs:"2.1K", price:"$99/mo",  tags:["Reservations","Reviews","Ops"]},
  {id:"hr",    name:"PeopleAI",    cat:"HR",       emoji:"👥", color:"#a594ff", desc:"Recruitment screening, onboarding workflows, leave management, and employee engagement surveys.", rating:4.8, installs:"780",  price:"$249/mo", tags:["Hiring","Onboarding","HR"]},
  {id:"ecom",  name:"ShopBot",     cat:"Industry", emoji:"🛍️", color:"#63c8c8", desc:"Abandoned cart recovery, product recommendations, return processing, and inventory alerts for e-commerce stores.", rating:4.9, installs:"3.4K", price:"$179/mo", tags:["Cart Recovery","Returns","Inventory"]},
  {id:"sdr2",  name:"ProspectAI",  cat:"Sales",    emoji:"🎯", color:"#7c6dfa", desc:"Advanced outbound with LinkedIn enrichment, multi-channel sequences, A/B testing, and deal coaching.", rating:4.7, installs:"1.8K", price:"$349/mo", tags:["Outbound","LinkedIn","A/B"]},
  {id:"cxai",  name:"CX360",       cat:"Support",  emoji:"💬", color:"#22d3b0", desc:"Omnichannel support across email, chat, and WhatsApp with advanced sentiment analysis and churn prediction.", rating:4.9, installs:"2.2K", price:"$199/mo", tags:["Omnichannel","Sentiment","Churn"]},
  {id:"fin2",  name:"CFObot",      cat:"Finance",  emoji:"📈", color:"#facc4b", desc:"Advanced financial modeling, runway analysis, fundraising materials, and investor reporting automation.", rating:4.8, installs:"430",  price:"$499/mo", tags:["Forecasting","Runway","Reporting"]},
  {id:"ins",   name:"InsureAI",    cat:"Industry", emoji:"🛡️", color:"#f06a40", desc:"Policy renewals, claims follow-up, cross-sell campaigns, and compliance monitoring for insurance brokers.", rating:4.6, installs:"320",  price:"$229/mo", tags:["Renewals","Claims","Compliance"]},
  {id:"cont",  name:"ContentOS",   cat:"Marketing",emoji:"✍️", color:"#a594ff", desc:"Full content calendar management, SEO optimization, repurposing across channels, and performance analytics.", rating:4.8, installs:"1.5K", price:"$249/mo", tags:["SEO","Calendar","Repurposing"]},
  {id:"comm",  name:"CommunityAI", cat:"Community",emoji:"🌐", color:"#63c8c8", desc:"Discord/Slack community management, member onboarding, event coordination, and engagement analytics.", rating:4.7, installs:"670",  price:"$149/mo", tags:["Community","Events","Engagement"]},
];

function Marketplace({installed, setInstalled}) {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  const filtered = MARKET_AGENTS.filter(a=>
    (cat==="All"||a.cat===cat) &&
    (a.name.toLowerCase().includes(search.toLowerCase())||a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>🏪 Agent Marketplace</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Deploy specialized AI agents built for your industry</div>
      </div>

      {/* Search + Filter */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agents…"
          style={{flex:1,minWidth:200,padding:"9px 14px",background:C.bg2,border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}} />
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {MARKET_CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"7px 14px",borderRadius:20,border:`0.5px solid ${cat===c?"rgba(124,109,250,0.5)":C.border}`,background:cat===c?"rgba(124,109,250,0.12)":"transparent",color:cat===c?C.purple2:C.text3,fontSize:12,cursor:"pointer"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        {[{label:"Available agents",val:MARKET_AGENTS.length},{label:"Installed",val:installed.length},{label:"Industries covered",val:"12+"}].map(s=>(
          <div key={s.label} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 16px"}}>
            <span style={{fontSize:18,fontWeight:700,color:C.purple2}}>{s.val}</span>
            <span style={{fontSize:12,color:C.text3,marginLeft:8}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(agent=>{
          const isInstalled = installed.includes(agent.id);
          return (
            <div key={agent.id} style={{background:C.bg2,border:`0.5px solid ${isInstalled?agent.color+"40":C.border}`,borderRadius:12,padding:"18px",cursor:"pointer",transition:".15s"}}
              onClick={()=>setPreview(agent)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:44,height:44,borderRadius:10,background:`${agent.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{agent.emoji}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:agent.color}}>{agent.name}</div>
                    <div style={{fontSize:11,color:C.text3}}>{agent.cat}</div>
                  </div>
                </div>
                {isInstalled && <Pill color={C.teal} bg="rgba(34,211,176,0.1)">Installed</Pill>}
              </div>
              <div style={{fontSize:13,color:C.text2,lineHeight:1.6,marginBottom:12,minHeight:60}}>{agent.desc}</div>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {agent.tags.map(t=><Pill key={t} color={C.text3} bg="rgba(255,255,255,0.05)">{t}</Pill>)}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontSize:12,color:C.gold}}>★ {agent.rating}</span>
                  <span style={{fontSize:11,color:C.text3,marginLeft:8}}>{agent.installs} installs</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:C.text}}>{agent.price}</span>
                  <button onClick={e=>{e.stopPropagation();setInstalled(p=>isInstalled?p.filter(x=>x!==agent.id):[...p,agent.id]);}}
                    style={{padding:"5px 12px",borderRadius:6,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",
                      background:isInstalled?"rgba(240,106,64,0.15)":agent.color,
                      color:isInstalled?C.coral:"#fff"}}>
                    {isInstalled?"Remove":"Install"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setPreview(null)}>
          <div style={{background:C.bg2,border:`0.5px solid ${preview.color}50`,borderRadius:16,padding:28,maxWidth:500,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",gap:14,marginBottom:16}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${preview.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{preview.emoji}</div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:preview.color}}>{preview.name}</div>
                <div style={{fontSize:12,color:C.text3,marginTop:2}}>{preview.cat} · ★ {preview.rating} · {preview.installs} installs</div>
              </div>
            </div>
            <div style={{fontSize:14,color:C.text2,lineHeight:1.7,marginBottom:16}}>{preview.desc}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
              {preview.tags.map(t=><Pill key={t} color={preview.color} bg={`${preview.color}15`}>{t}</Pill>)}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{setInstalled(p=>p.includes(preview.id)?p.filter(x=>x!==preview.id):[...p,preview.id]);setPreview(null);}}
                style={{flex:1,background:installed.includes(preview.id)?"rgba(240,106,64,0.15)":preview.color,color:installed.includes(preview.id)?C.coral:"#fff"}}>
                {installed.includes(preview.id)?"Remove Agent":"Install Agent — "+preview.price}
              </Btn>
              <Btn variant="ghost" onClick={()=>setPreview(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// 4. ONBOARDING WIZARD
// ══════════════════════════════════════════════
const STEPS = ["Company Info","Company Brain","Integrations","Your ICP","First Agent","Launch 🚀"];

function Onboarding({onComplete}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    company:"", industry:"", size:"", website:"",
    docs:[], integrations:[],
    icpSize:"", icpIndustry:"", icpRevenue:"", icpTitle:"",
    agent:"aria",
  });
  const [uploading, setUploading] = useState(false);

  const upd = (k,v) => setData(d=>({...d,[k]:v}));
  const next = () => setStep(s=>Math.min(s+1,STEPS.length-1));
  const prev = () => setStep(s=>Math.max(s-1,0));

  const INTEGRATIONS = [
    {id:"gmail",name:"Gmail",emoji:"📧"},{id:"gsheet",name:"Google Drive",emoji:"📁"},
    {id:"slack",name:"Slack",emoji:"💬"},{id:"hubspot",name:"HubSpot",emoji:"🟠"},
    {id:"stripe",name:"Stripe",emoji:"💳"},{id:"notion",name:"Notion",emoji:"📓"},
    {id:"salesforce",name:"Salesforce",emoji:"☁️"},{id:"zapier",name:"Zapier",emoji:"⚡"},
  ];

  const DOC_TYPES = ["Product Documentation","ICP & Buyer Personas","Sales Playbook","Brand Voice Guide","Pricing & Objections","SOPs & Workflows","Customer Case Studies","Competitive Battlecards"];

  const addDoc = (docName) => {
    setUploading(true);
    setTimeout(()=>{
      if(!data.docs.includes(docName)) upd("docs",[...data.docs,docName]);
      setUploading(false);
    },800);
  };

  const toggleInt = (id) => {
    upd("integrations", data.integrations.includes(id)?data.integrations.filter(x=>x!==id):[...data.integrations,id]);
  };

  const progress = ((step)/(STEPS.length-1))*100;

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>🚀 Setup Wizard</div>
          <div style={{fontSize:13,color:C.text3,marginTop:2}}>Get your AI workforce running in under 30 minutes</div>
        </div>

        {/* Progress */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            {STEPS.map((s,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,marginBottom:4,
                  background:i<step?"rgba(34,211,176,0.2)":i===step?"rgba(124,109,250,0.2)":"rgba(255,255,255,0.05)",
                  border:`1.5px solid ${i<step?C.teal:i===step?C.purple:C.border}`,
                  color:i<step?C.teal:i===step?C.purple2:C.text3}}>
                  {i<step?"✓":i+1}
                </div>
                <div style={{fontSize:9,color:i===step?C.purple2:C.text3,textAlign:"center",lineHeight:1.2}}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:3,marginTop:4}}>
            <div style={{height:"100%",width:`${progress}%`,background:C.grad,borderRadius:3,transition:".4s"}} />
          </div>
        </div>

        <Card style={{minHeight:300}}>
          {/* STEP 0 */}
          {step===0 && (
            <div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Tell us about your company</div>
              <div style={{fontSize:13,color:C.text3,marginBottom:20}}>This goes into your Company Brain so all agents know who they work for.</div>
              {[
                {label:"Company name",key:"company",ph:"e.g. Nexus AI"},
                {label:"Website",key:"website",ph:"e.g. nexusai.com"},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:C.text2,marginBottom:6}}>{f.label}</div>
                  <input value={data[f.key]} onChange={e=>upd(f.key,e.target.value)} placeholder={f.ph}
                    style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}} />
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {label:"Industry",key:"industry",opts:["SaaS","E-commerce","Agency","Fintech","Healthcare","Real Estate","Legal","Other"]},
                  {label:"Company size",key:"size",opts:["1-10","11-50","51-200","201-500","500+"]},
                ].map(f=>(
                  <div key={f.key}>
                    <div style={{fontSize:12,color:C.text2,marginBottom:6}}>{f.label}</div>
                    <select value={data[f.key]} onChange={e=>upd(f.key,e.target.value)}
                      style={{width:"100%",padding:"9px 12px",background:C.bg3,border:`0.5px solid ${C.border2}`,borderRadius:8,color:data[f.key]?C.text:C.text3,fontSize:13,outline:"none"}}>
                      <option value="">Select…</option>
                      {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Build your Company Brain</div>
              <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Upload documents so your AI employees know everything about your business. More docs = smarter agents.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                {DOC_TYPES.map(d=>{
                  const done = data.docs.includes(d);
                  return (
                    <button key={d} onClick={()=>!done&&addDoc(d)} style={{padding:"10px 14px",background:done?"rgba(34,211,176,0.08)":"rgba(255,255,255,0.03)",border:`0.5px solid ${done?C.teal+"50":C.border}`,borderRadius:8,color:done?C.teal:C.text2,fontSize:12,cursor:done?"default":"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
                      <span>{done?"✓":"+"}</span>{d}
                    </button>
                  );
                })}
              </div>
              {uploading && <div style={{fontSize:12,color:C.purple2,display:"flex",alignItems:"center",gap:8}}><Spinner size={12} color={C.purple} /> Uploading & embedding…</div>}
              {data.docs.length>0 && (
                <div style={{background:"rgba(34,211,176,0.06)",border:`0.5px solid rgba(34,211,176,0.2)`,borderRadius:8,padding:"10px 14px"}}>
                  <div style={{fontSize:12,color:C.teal,fontWeight:600}}>{data.docs.length} documents indexed in Company Brain</div>
                  <div style={{fontSize:11,color:C.text3,marginTop:2}}>Estimated completeness: {Math.min(100,data.docs.length*13)}%</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Connect your tools</div>
              <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Your AI employees need access to your existing tools to take real actions.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {INTEGRATIONS.map(int=>{
                  const connected = data.integrations.includes(int.id);
                  return (
                    <div key={int.id} onClick={()=>toggleInt(int.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:connected?"rgba(34,211,176,0.06)":"rgba(255,255,255,0.03)",border:`0.5px solid ${connected?C.teal+"50":C.border}`,borderRadius:10,cursor:"pointer"}}>
                      <span style={{fontSize:20}}>{int.emoji}</span>
                      <span style={{fontSize:13,fontWeight:500,flex:1}}>{int.name}</span>
                      <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${connected?C.teal:C.border2}`,background:connected?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{connected?"✓":""}</div>
                    </div>
                  );
                })}
              </div>
              {data.integrations.length>0 && (
                <div style={{marginTop:14,fontSize:12,color:C.teal}}>✓ {data.integrations.length} integration{data.integrations.length>1?"s":""} connected</div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Define your Ideal Customer Profile</div>
              <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Aria uses this to score leads and write personalized outreach. The more specific, the better.</div>
              {[
                {label:"Target company size",key:"icpSize",ph:"e.g. 10-200 employees, Series A/B"},
                {label:"Target industries",key:"icpIndustry",ph:"e.g. SaaS, Fintech, E-commerce"},
                {label:"Target revenue",key:"icpRevenue",ph:"e.g. $500K - $20M ARR"},
                {label:"Target job titles (buyers)",key:"icpTitle",ph:"e.g. CEO, COO, Head of Sales, Operations Lead"},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:C.text2,marginBottom:6}}>{f.label}</div>
                  <input value={data[f.key]} onChange={e=>upd(f.key,e.target.value)} placeholder={f.ph}
                    style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}} />
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 */}
          {step===4 && (
            <div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Choose your first AI employee</div>
              <div style={{fontSize:13,color:C.text3,marginBottom:20}}>Start with one. You can add more anytime. We recommend starting with the one that unlocks your biggest bottleneck.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {AGENTS.map(a=>(
                  <div key={a.id} onClick={()=>upd("agent",a.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:data.agent===a.id?a.bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${data.agent===a.id?a.color+"60":C.border}`,borderRadius:10,cursor:"pointer"}}>
                    <span style={{fontSize:22}}>{a.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:data.agent===a.id?a.color:C.text}}>{a.name} — {a.role}</div>
                      <div style={{fontSize:12,color:C.text3,marginTop:2}}>
                        {{aria:"Outreach, lead scoring, follow-ups, CRM updates",marcus:"Ticket resolution, churn prevention, KB building",lexi:"Campaigns, content, social, email sequences",felix:"Invoicing, reporting, forecasting, expense alerts",nova:"Workflows, coordination, project management"}[a.id]}
                      </div>
                    </div>
                    <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${data.agent===a.id?a.color:C.border2}`,background:data.agent===a.id?a.color:"transparent"}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5 — LAUNCH */}
          {step===5 && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚀</div>
              <div style={{fontSize:22,fontWeight:800,letterSpacing:-.5,marginBottom:8}}>You're ready to launch!</div>
              <div style={{fontSize:14,color:C.text2,lineHeight:1.7,marginBottom:24}}>
                Your Company Brain has <strong style={{color:C.purple2}}>{data.docs.length} documents</strong> indexed,{" "}
                <strong style={{color:C.teal}}>{data.integrations.length} integrations</strong> connected, and{" "}
                <strong style={{color:AGENTS.find(a=>a.id===data.agent)?.color}}>{AGENTS.find(a=>a.id===data.agent)?.name}</strong> ready to deploy.
              </div>
              <div style={{background:"rgba(124,109,250,0.08)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:12,padding:16,marginBottom:24,textAlign:"left"}}>
                {[
                  {label:"Company",val:data.company||"Your company"},
                  {label:"Industry",val:data.industry||"Not set"},
                  {label:"Brain documents",val:`${data.docs.length} indexed`},
                  {label:"Integrations",val:`${data.integrations.length} connected`},
                  {label:"First AI employee",val:AGENTS.find(a=>a.id===data.agent)?.name+" ("+AGENTS.find(a=>a.id===data.agent)?.role+")"},
                ].map(r=>(
                  <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${C.border}`}}>
                    <span style={{fontSize:13,color:C.text3}}>{r.label}</span>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{r.val}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={onComplete} style={{fontSize:15,padding:"13px 36px",background:C.grad,border:"none"}}>
                🚀 Launch AI Workforce
              </Btn>
            </div>
          )}
        </Card>

        {/* Nav */}
        {step<5 && (
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <Btn variant="ghost" onClick={prev} disabled={step===0}>← Back</Btn>
            <Btn onClick={next}>
              {step===4?"Review & Launch →":"Next →"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 5. WORKFORCE (reuse console style)
// ══════════════════════════════════════════════
function Workforce() {
  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>🤖 AI Workforce</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>All your AI employees — health, goals, and performance</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {AGENTS.map(a=>(
          <Card key={a.id} style={{border:`0.5px solid ${a.color}30`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{a.emoji}</div>
              <div>
                <div style={{fontWeight:700,color:a.color,fontSize:15}}>{a.name}</div>
                <div style={{fontSize:12,color:C.text3}}>AI {a.role}</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.teal}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.teal}} />Active
              </div>
            </div>
            {[
              {label:"Autonomy",val:"Supervised",color:C.gold},
              {label:"Actions today",val:Math.floor(10+Math.random()*40),color:C.purple2},
              {label:"Success rate",val:Math.floor(88+Math.random()*10)+"%",color:C.teal},
            ].map(m=>(
              <div key={m.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text3}}>{m.label}</span>
                <span style={{fontSize:12,fontWeight:600,color:m.color}}>{m.val}</span>
              </div>
            ))}
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <Btn variant="ghost" style={{flex:1,fontSize:12,padding:"6px 0"}}>View Activity</Btn>
              <Btn style={{flex:1,fontSize:12,padding:"6px 0",background:a.color}}>Run Task</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// BRAIN VIEW (simple)
// ══════════════════════════════════════════════
function Brain() {
  const docs = [
    {title:"Product Documentation v3",type:"product",chunks:34,status:"synced"},
    {title:"ICP & Buyer Personas",type:"persona",chunks:12,status:"synced"},
    {title:"Sales Playbook 2026",type:"playbook",chunks:28,status:"synced"},
    {title:"Brand Voice Guide",type:"sop",chunks:9,status:"synced"},
    {title:"CRM Contacts Snapshot",type:"crm_sync",chunks:156,status:"synced"},
    {title:"Pricing & Objection Handling",type:"playbook",chunks:18,status:"synced"},
  ];
  const emojis = {product:"📦",persona:"👤",playbook:"📖",sop:"⚙️",crm_sync:"🔄"};
  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:-.5}}>🧠 Company Brain</div>
          <div style={{fontSize:13,color:C.text3,marginTop:2}}>Shared knowledge powering every AI employee</div>
        </div>
        <Btn>+ Upload Document</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {[{label:"Documents",val:docs.length,color:C.purple2},{label:"Total chunks",val:docs.reduce((s,d)=>s+d.chunks,0),color:C.teal},{label:"Brain health",val:"74%",color:C.gold}].map(m=>(
          <Card key={m.label}>
            <div style={{fontSize:11,color:C.text3,marginBottom:4}}>{m.label.toUpperCase()}</div>
            <div style={{fontSize:26,fontWeight:800,color:m.color}}>{m.val}</div>
          </Card>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {docs.map((d,i)=>(
          <div key={i} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>{emojis[d.type]||"📄"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:500}}>{d.title}</div>
              <div style={{fontSize:11,color:C.text3,marginTop:2}}>{d.type} · {d.chunks} chunks</div>
            </div>
            <Pill color={C.teal} bg="rgba(34,211,176,0.1)">✓ Synced</Pill>
          </div>
        ))}
      </div>
      <Card style={{marginTop:16,background:"rgba(124,109,250,0.06)",border:"0.5px solid rgba(124,109,250,0.2)"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.purple2,marginBottom:10}}>⚠ Missing context — reduces AI quality</div>
        {["Customer case studies","Competitive battlecards","Onboarding SOPs","Pricing objection scripts"].map((item,i)=>(
          <div key={i} style={{fontSize:12,color:C.text3,display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{color:C.gold}}>!</span>{item}
            <button style={{marginLeft:"auto",padding:"3px 10px",background:"rgba(124,109,250,0.1)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:6,color:C.purple2,fontSize:11,cursor:"pointer"}}>Add</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("onboarding");
  const [onboarded, setOnboarded] = useState(false);
  const [installed, setInstalled] = useState([]);
  const [metrics] = useState({emails:287,tickets:43,meetings:14});

  const handleComplete = () => { setOnboarded(true); setView("dashboard"); };

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",color:C.text,overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input,select,textarea{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
      <Sidebar view={view} setView={setView} onboarded={onboarded} />
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Topbar metrics={metrics} />
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>
          {view==="dashboard"   && <Dashboard />}
          {view==="command"     && <CommandCenter />}
          {view==="workforce"   && <Workforce />}
          {view==="brain"       && <Brain />}
          {view==="marketplace" && <Marketplace installed={installed} setInstalled={setInstalled} />}
          {view==="onboarding"  && <Onboarding onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
