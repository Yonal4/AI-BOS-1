import { useState, useEffect, useRef } from "react";

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

const NAV = [
  {id:"owner",     icon:"📱", label:"Owner Dashboard"},
  {id:"command",   icon:"⚡", label:"Command Center v2"},
  {id:"brain",     icon:"🧠", label:"Company Brain"},
  {id:"market",    icon:"🏪", label:"Marketplace v2"},
];

const Pill = ({children, color=C.purple2, bg="rgba(124,109,250,0.12)"}) => (
  <span style={{padding:"2px 10px",borderRadius:20,background:bg,color,fontSize:11,fontWeight:600}}>{children}</span>
);
const Card = ({children, style={}}) => (
  <div style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"18px 20px",...style}}>{children}</div>
);
const Btn = ({children,onClick,style={},disabled=false,variant="primary"}) => {
  const vars = {
    primary:{background:C.purple,color:"#fff"},
    ghost:{background:"rgba(255,255,255,0.05)",color:C.text2,border:`0.5px solid ${C.border2}`},
    teal:{background:C.teal,color:"#fff"},
    danger:{background:"rgba(240,106,64,0.12)",color:C.coral,border:`0.5px solid rgba(240,106,64,0.3)`},
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",transition:".15s",opacity:disabled?.5:1,...vars[variant],...style}}>
      {children}
    </button>
  );
};
const Spinner = ({size=14,color="#fff"}) => (
  <span style={{display:"inline-block",width:size,height:size,border:`2px solid rgba(255,255,255,0.2)`,borderTopColor:color,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
);

// ── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({view,setView}) {
  return (
    <div style={{width:210,background:C.bg2,borderRight:`0.5px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,padding:"0 10px"}}>
      <div style={{padding:"16px 6px 14px",display:"flex",alignItems:"center",gap:9,borderBottom:`0.5px solid ${C.border}`,marginBottom:10}}>
        <div style={{width:28,height:28,background:C.grad,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>B</div>
        <span style={{fontWeight:700,fontSize:15,letterSpacing:-.3}}>AI BOS</span>
        <Pill color={C.teal} bg="rgba(34,211,176,0.12)">v2</Pill>
      </div>
      <div style={{fontSize:10,color:C.text3,letterSpacing:.8,textTransform:"uppercase",padding:"8px 12px 4px"}}>New Modules</div>
      {NAV.map(n=>(
        <div key={n.id} onClick={()=>setView(n.id)} style={{
          display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,cursor:"pointer",marginBottom:3,
          background:view===n.id?"rgba(124,109,250,0.12)":"transparent",
          color:view===n.id?C.purple2:C.text3,fontSize:13,fontWeight:view===n.id?600:400,
          border:view===n.id?`0.5px solid rgba(124,109,250,0.25)`:"0.5px solid transparent",
        }}>
          <span style={{fontSize:15}}>{n.icon}</span>{n.label}
        </div>
      ))}
      <div style={{marginTop:"auto",padding:"12px 8px",borderTop:`0.5px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.text3,marginBottom:6}}>Brain Health</div>
        <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:4}}>
          <div style={{height:"100%",width:"74%",background:C.grad,borderRadius:4}}/>
        </div>
        <div style={{fontSize:10,color:C.text3,marginTop:4}}>74% complete · 6 docs missing</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. OWNER MOBILE DASHBOARD
// ══════════════════════════════════════════════════════════════
const MRR_SPARK = [18,22,27,31,38,47];

function SparkLine({data,color}) {
  const max=Math.max(...data), min=Math.min(...data);
  const w=120,h=36,pad=4;
  const pts=data.map((v,i)=>{
    const x=pad+(i/(data.length-1))*(w-pad*2);
    const y=h-pad-((v-min)/(max-min||1))*(h-pad*2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v,i)=>{
        const x=pad+(i/(data.length-1))*(w-pad*2);
        const y=h-pad-((v-min)/(max-min||1))*(h-pad*2);
        return i===data.length-1?<circle key={i} cx={x} cy={y} r={3} fill={color}/>:null;
      })}
    </svg>
  );
}

const OWNER_APPROVALS = [
  {id:1,agent:"aria",  emoji:"📊",color:"#7c6dfa",text:"Send cold sequence to 12 enterprise leads from Stripe's team",confidence:68,value:"$23,880 potential"},
  {id:2,agent:"lexi",  emoji:"📣",color:"#f06a40",text:"Launch $4,500 LinkedIn ad campaign for Q3 push",confidence:71,value:"$4,500 spend"},
  {id:3,agent:"felix", emoji:"💰",color:"#facc4b",text:"Issue refund to customer TechCorp ($1,200)",confidence:55,value:"$1,200 outflow"},
];

const LIVE_PULSE = [
  {agent:"aria",  emoji:"📊",color:"#7c6dfa",text:"Booked meeting with Jordan Blake, VP Eng at TechFlow",time:"just now"},
  {agent:"marcus",emoji:"🎧",color:"#22d3b0",text:"Resolved 4 tickets — 1 escalated with churn risk flag",time:"3 min ago"},
  {agent:"lexi",  emoji:"📣",color:"#f06a40",text:"LinkedIn post live — 1,200 impressions in 8 min",time:"9 min ago"},
  {agent:"nova",  emoji:"⚙️",color:"#63c8c8",text:"Deal handoff coordinated: Nexus AI → onboarding",time:"22 min ago"},
  {agent:"felix", emoji:"💰",color:"#facc4b",text:"API cost spike detected — up 18%, report generated",time:"1 hr ago"},
];

function OwnerDashboard() {
  const [approvals, setApprovals] = useState(OWNER_APPROVALS);
  const [tab, setTab] = useState("today");

  const approve = (id) => setApprovals(a=>a.filter(x=>x.id!==id));
  const reject  = (id) => setApprovals(a=>a.filter(x=>x.id!==id));

  return (
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:-.5}}>📱 Owner Dashboard</div>
          <div style={{fontSize:12,color:C.text3,marginTop:2}}>Sun Jun 14 2026 · All agents online</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(34,211,176,0.1)",border:`0.5px solid rgba(34,211,176,0.3)`,borderRadius:20,padding:"6px 14px"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.teal,boxShadow:`0 0 8px ${C.teal}`}}/>
          <span style={{fontSize:12,color:C.teal,fontWeight:600}}>5/5 agents active</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {label:"MRR",val:"$47.2K",sub:"↑ $8.1K",color:C.teal,spark:MRR_SPARK},
          {label:"Meetings",val:"14",sub:"↑ 3 today",color:C.purple2,spark:[8,11,9,13,12,14]},
          {label:"Tickets",val:"43",sub:"67% auto",color:C.coral,spark:[30,35,28,40,38,43]},
          {label:"Autonomy",val:"74%",sub:"↑ 6% MoM",color:C.gold,spark:[60,63,67,69,71,74]},
        ].map(k=>(
          <Card key={k.label} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:10,color:C.text3,letterSpacing:.5,marginBottom:4}}>{k.label.toUpperCase()}</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-1,color:k.color}}>{k.val}</div>
                <div style={{fontSize:11,color:C.teal,marginTop:2}}>{k.sub}</div>
              </div>
              <SparkLine data={k.spark} color={k.color}/>
            </div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        {/* LEFT */}
        <div>
          {/* Approvals */}
          {approvals.length>0 && (
            <Card style={{marginBottom:16,border:`0.5px solid rgba(250,204,75,0.3)`,background:"rgba(250,204,75,0.03)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <span style={{fontSize:14}}>⏳</span>
                <span style={{fontSize:13,fontWeight:700,color:C.gold}}>Pending Approvals ({approvals.length})</span>
                <span style={{fontSize:11,color:C.text3,marginLeft:"auto"}}>Agents waiting on you</span>
              </div>
              {approvals.map(ap=>(
                <div key={ap.id} style={{background:"rgba(250,204,75,0.06)",border:`0.5px solid rgba(250,204,75,0.2)`,borderRadius:10,padding:"14px",marginBottom:10}}>
                  <div style={{display:"flex",gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`${ap.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ap.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:ap.color,marginBottom:2}}>{ap.agent.charAt(0).toUpperCase()+ap.agent.slice(1)} wants to:</div>
                      <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{ap.text}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:12}}>
                      <span style={{fontSize:11,color:C.text3}}>Confidence: <span style={{color:C.gold,fontWeight:700}}>{ap.confidence}%</span></span>
                      <span style={{fontSize:11,color:C.coral,fontWeight:600}}>{ap.value}</span>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>reject(ap.id)} style={{padding:"6px 14px",background:"rgba(240,106,64,0.12)",border:`0.5px solid rgba(240,106,64,0.3)`,borderRadius:6,color:C.coral,fontSize:12,fontWeight:600,cursor:"pointer"}}>✕ Reject</button>
                      <button onClick={()=>approve(ap.id)} style={{padding:"6px 14px",background:"rgba(34,211,176,0.15)",border:`0.5px solid rgba(34,211,176,0.35)`,borderRadius:6,color:C.teal,fontSize:12,fontWeight:600,cursor:"pointer"}}>✓ Approve</button>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Agent Performance */}
          <Card style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Agent Performance Today</div>
            {AGENTS.map(a=>{
              const stats = {
                aria:  {tasks:47, wins:"14 meetings", rate:92},
                marcus:{tasks:43, wins:"29 resolved", rate:87},
                lexi:  {tasks:12, wins:"2 campaigns",  rate:95},
                felix: {tasks:8,  wins:"3 reports",    rate:100},
                nova:  {tasks:23, wins:"6 handoffs",   rate:89},
              }[a.id];
              return (
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:a.color}}>{a.name}</span>
                      <span style={{fontSize:11,color:C.text3}}>{stats.tasks} tasks · {stats.wins}</span>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                      <div style={{height:"100%",width:`${stats.rate}%`,background:a.color,borderRadius:3,opacity:.8}}/>
                    </div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:a.color,minWidth:36,textAlign:"right"}}>{stats.rate}%</span>
                </div>
              );
            })}
          </Card>

          {/* Quick Command */}
          <Card style={{background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.25)`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.purple2,marginBottom:10}}>⚡ Quick Command</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Boost pipeline this week","Prepare board report","Handle churn risks","Launch product update campaign"].map(cmd=>(
                <button key={cmd} style={{padding:"7px 12px",background:"rgba(124,109,250,0.1)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:20,color:C.purple2,fontSize:12,cursor:"pointer"}}>{cmd}</button>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT — Live Pulse */}
        <div>
          <Card style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>🔴 Live Agent Pulse</div>
            {LIVE_PULSE.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:`${item.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{item.emoji}</div>
                <div>
                  <div style={{fontSize:12,color:C.text2,lineHeight:1.5}}><span style={{fontWeight:600,color:item.color}}>{item.agent}</span> {item.text}</div>
                  <div style={{fontSize:10,color:C.text3,marginTop:2}}>{item.time}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>📊 Revenue Breakdown</div>
            {[
              {label:"New MRR",val:"$8,100",color:C.teal},
              {label:"Expansion MRR",val:"$3,200",color:C.purple2},
              {label:"Churned MRR",val:"-$2,400",color:C.coral},
              {label:"Net New MRR",val:"$8,900",color:C.gold},
            ].map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.text2}}>{r.label}</span>
                <span style={{fontSize:14,fontWeight:700,color:r.color}}>{r.val}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. COMMAND CENTER v2 — Multi-agent streaming with live steps
// ══════════════════════════════════════════════════════════════
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
  "summary": "2-sentence executive summary",
  "timeline": "e.g. 2 weeks",
  "expectedImpact": "quantified expected outcome",
  "confidence": 85,
  "crossAgentDeps": ["e.g. Aria → Nova: deal handoff after close"],
  "tasks": [
    {
      "agentId": "aria|marcus|lexi|felix|nova",
      "priority": "critical|high|medium",
      "title": "short task title",
      "description": "detailed what and why",
      "actions": ["action 1", "action 2", "action 3"],
      "kpi": "how success is measured",
      "timeframe": "e.g. 48 hours",
      "dependsOn": "agentId or null",
      "estimatedValue": "e.g. $12K pipeline"
    }
  ]
}`;

const AGENT_SYSTEMS = {
  aria: `You are Aria, an elite AI Sales Development Representative for AI BOS. AI BOS is an AI Business Operating System ($299-$1,999/mo). Your ICP: funded startups 5-200 employees. Be specific, human, actionable. Given a task from Command Center, explain exactly what you will do and draft one concrete output (email, script, or plan).`,
  marcus: `You are Marcus, AI Customer Support specialist for AI BOS. Be empathetic, solution-focused, proactive about churn. Given a task from Command Center, explain exactly what you will do and show one concrete action (ticket response, churn analysis, or KB article).`,
  lexi: `You are Lexi, AI Marketing Manager for AI BOS. Bold, direct, outcome-focused writing. No fluff. Given a task, explain your approach and produce one concrete deliverable (post, email, campaign plan).`,
  felix: `You are Felix, AI Finance Analyst for AI BOS. Numbers first. Given a task, show your analysis with specific figures and a clear recommendation. Structure: Summary → Key Signals → Action.`,
  nova: `You are Nova, AI Operations Lead for AI BOS. You coordinate across all agents. Given a task, produce a specific cross-functional action plan with agent assignments, sequence, and dependencies.`,
};

function CommandV2() {
  const [cmd, setCmd] = useState("");
  const [phase, setPhase] = useState("idle"); // idle|planning|executing|done
  const [plan, setPlan] = useState(null);
  const [agentOutputs, setAgentOutputs] = useState({});
  const [runningAgent, setRunningAgent] = useState(null);
  const [executed, setExecuted] = useState({});
  const [err, setErr] = useState("");
  const [planSteps, setPlanSteps] = useState([]);
  const bottomRef = useRef();

  const STEPS_MSGS = [
    "Analyzing business goal…",
    "Querying Company Brain for context…",
    "Mapping cross-department dependencies…",
    "Assigning tasks to AI employees…",
    "Calculating expected impact & timeline…",
    "Building execution plan…",
  ];

  const generatePlan = async () => {
    if (!cmd.trim()) return;
    setPhase("planning"); setPlan(null); setAgentOutputs({}); setExecuted({}); setErr(""); setPlanSteps([]);

    // Animate steps
    for (let i=0;i<STEPS_MSGS.length;i++) {
      await new Promise(r=>setTimeout(r,400));
      setPlanSteps(p=>[...p, STEPS_MSGS[i]]);
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,system:CMD_SYSTEM,messages:[{role:"user",content:cmd}]}),
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      setPlan(JSON.parse(clean));
      setPhase("ready");
    } catch(e) { setErr("Failed to generate plan. Try again."); setPhase("idle"); }
  };

  const runAgent = async (task, idx) => {
    if (runningAgent) return;
    setRunningAgent(idx);
    const agent = AGENTS.find(a=>a.id===task.agentId)||AGENTS[0];
    try {
      const prompt = `You have been assigned this task by the AI BOS Command Center:\n\nGOAL: ${plan.goal}\nYOUR TASK: ${task.title}\nDESCRIPTION: ${task.description}\nACTIONS TO TAKE:\n${task.actions.map((a,i)=>`${i+1}. ${a}`).join("\n")}\nKPI: ${task.kpi}\nTIMEFRAME: ${task.timeframe}\n\nRespond with:\n1. Your execution approach (2-3 sentences)\n2. ONE concrete deliverable (draft email / analysis / campaign plan / report)\n3. What you'll hand off to the next agent (if any)`;
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,system:AGENT_SYSTEMS[task.agentId]||AGENT_SYSTEMS.nova,messages:[{role:"user",content:prompt}]}),
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      setAgentOutputs(p=>({...p,[idx]:text}));
      setExecuted(p=>({...p,[idx]:true}));
    } catch(e) { setAgentOutputs(p=>({...p,[idx]:"Error running agent. Try again."})); }
    setRunningAgent(null);
  };

  const runAll = async () => {
    if (!plan) return;
    setPhase("executing");
    for (let i=0;i<plan.tasks.length;i++) {
      if (!executed[i]) await runAgent(plan.tasks[i], i);
      await new Promise(r=>setTimeout(r,300));
    }
    setPhase("done");
  };

  const prioColor = p=>p==="critical"?C.coral:p==="high"?C.gold:C.teal;

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:-.5}}>⚡ Command Center v2</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Multi-agent live execution · each agent responds in real time</div>
      </div>

      {/* Input */}
      <Card style={{marginBottom:20,background:"rgba(124,109,250,0.05)",border:`0.5px solid rgba(124,109,250,0.3)`}}>
        <div style={{fontSize:11,color:C.purple2,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>Business Goal</div>
        <textarea value={cmd} onChange={e=>setCmd(e.target.value)}
          placeholder="e.g. Increase revenue by 20% this quarter…"
          style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,lineHeight:1.6,resize:"none",minHeight:72,outline:"none",fontFamily:"inherit"}}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Increase revenue 20%","Handle churn risk — 3 customers","Launch new feature campaign","Close 5 stalled deals"].map((ex,i)=>(
              <button key={i} onClick={()=>setCmd(ex)} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border}`,borderRadius:20,fontSize:11,color:C.text3,cursor:"pointer"}}>{ex}</button>
            ))}
          </div>
          <Btn onClick={generatePlan} disabled={phase==="planning"||!cmd.trim()} style={{minWidth:160,display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
            {phase==="planning"?<><Spinner/>Generating…</>:"⚡ Generate Plan"}
          </Btn>
        </div>
      </Card>

      {err && <div style={{color:C.coral,fontSize:13,marginBottom:16}}>{err}</div>}

      {/* Planning animation */}
      {phase==="planning" && (
        <Card style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:C.purple2}}>🧠 Command Intelligence thinking…</div>
          {planSteps.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,color:C.text2,fontSize:13,marginBottom:8,animation:"fadeIn .3s ease"}}>
              <span style={{color:C.teal,fontWeight:700}}>✓</span>{s}
            </div>
          ))}
          {planSteps.length<STEPS_MSGS.length && <div style={{display:"flex",alignItems:"center",gap:10,color:C.text3,fontSize:13}}><Spinner size={12} color={C.purple}/>{STEPS_MSGS[planSteps.length]}</div>}
        </Card>
      )}

      {/* Plan Summary */}
      {plan && (
        <div>
          <Card style={{marginBottom:16,background:"rgba(124,109,250,0.07)",border:`0.5px solid rgba(124,109,250,0.35)`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:800,letterSpacing:-.3,marginBottom:6}}>{plan.goal}</div>
                <div style={{fontSize:13,color:C.text2,lineHeight:1.6,marginBottom:10}}>{plan.summary}</div>
                {plan.crossAgentDeps?.length>0 && (
                  <div>
                    <div style={{fontSize:11,color:C.text3,marginBottom:6}}>CROSS-AGENT DEPENDENCIES</div>
                    {plan.crossAgentDeps.map((d,i)=>(
                      <div key={i} style={{fontSize:12,color:C.purple2,background:"rgba(124,109,250,0.08)",borderRadius:6,padding:"4px 10px",display:"inline-block",marginRight:6,marginBottom:4}}>→ {d}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:10,flexShrink:0,flexWrap:"wrap"}}>
                {[
                  {label:"Timeline",val:plan.timeline,color:C.teal},
                  {label:"Impact",val:plan.expectedImpact,color:C.purple2},
                  {label:"Confidence",val:`${plan.confidence}%`,color:C.gold},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:"center",padding:"10px 16px",background:`${m.color}12`,borderRadius:10,border:`0.5px solid ${m.color}30`}}>
                    <div style={{fontSize:10,color:C.text3,marginBottom:2}}>{m.label.toUpperCase()}</div>
                    <div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
            {phase!=="executing"&&phase!=="done" && (
              <div style={{marginTop:16,display:"flex",gap:10}}>
                <Btn onClick={runAll} style={{background:C.grad,border:"none",display:"flex",alignItems:"center",gap:8}}>🚀 Execute All Agents</Btn>
                <Btn variant="ghost">📋 Export Plan</Btn>
              </div>
            )}
            {phase==="executing" && <div style={{marginTop:12,fontSize:13,color:C.purple2,display:"flex",alignItems:"center",gap:8}}><Spinner color={C.purple}/>Executing across {plan.tasks.length} agents…</div>}
            {phase==="done" && <div style={{marginTop:12,fontSize:13,color:C.teal,fontWeight:600}}>✓ All agents executed — check outputs below</div>}
          </Card>

          {/* Tasks with live agent outputs */}
          <div style={{fontSize:11,color:C.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:12}}>{plan.tasks?.length} Agent Tasks</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {plan.tasks?.map((task,i)=>{
              const agent=AGENTS.find(a=>a.id===task.agentId)||AGENTS[0];
              const isRunning=runningAgent===i;
              const isDone=!!executed[i];
              const output=agentOutputs[i];
              return (
                <Card key={i} style={{border:`0.5px solid ${agent.color}30`,background:isDone?"rgba(34,211,176,0.02)":C.bg2}}>
                  <div style={{display:"flex",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:agent.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{agent.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                        <span style={{fontWeight:700,color:agent.color,fontSize:14}}>{agent.name}</span>
                        <Pill color={prioColor(task.priority)} bg={`${prioColor(task.priority)}18`}>{task.priority}</Pill>
                        <span style={{fontSize:11,color:C.text3}}>⏱ {task.timeframe}</span>
                        {task.estimatedValue && <Pill color={C.gold} bg="rgba(250,204,75,0.1)">{task.estimatedValue}</Pill>}
                        {isDone && <Pill color={C.teal} bg="rgba(34,211,176,0.12)">✓ Executed</Pill>}
                        {task.dependsOn && <span style={{fontSize:11,color:C.text3}}>← depends on {task.dependsOn}</span>}
                      </div>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{task.title}</div>
                      <div style={{fontSize:13,color:C.text2,marginBottom:10,lineHeight:1.6}}>{task.description}</div>
                      <div style={{marginBottom:10}}>
                        {task.actions?.map((a,j)=>(
                          <div key={j} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:12,color:C.text2,marginBottom:4}}>
                            <span style={{color:agent.color,fontWeight:700,flexShrink:0}}>→</span>{a}
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:11,color:C.text3,marginBottom:12}}>KPI: <span style={{color:C.gold}}>{task.kpi}</span></div>

                      {/* Agent live output */}
                      {isRunning && (
                        <div style={{background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,color:C.purple2,fontSize:12}}><Spinner size={12} color={C.purple}/>{agent.name} is executing this task…</div>
                        </div>
                      )}
                      {output && (
                        <div style={{background:`${agent.color}08`,border:`0.5px solid ${agent.color}30`,borderRadius:10,padding:"14px 16px",marginBottom:10}}>
                          <div style={{fontSize:11,color:agent.color,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>{agent.name}'s Output</div>
                          <div style={{fontSize:13,color:C.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{output}</div>
                        </div>
                      )}

                      <div style={{display:"flex",gap:8}}>
                        {!isDone && !isRunning && (
                          <Btn onClick={()=>runAgent(task,i)} disabled={!!runningAgent} style={{fontSize:12,padding:"6px 14px",background:agent.color}}>
                            Run {agent.name} →
                          </Btn>
                        )}
                        {isDone && <span style={{fontSize:12,color:C.teal,display:"flex",alignItems:"center",gap:6}}><span>✓</span>Agent deployed</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {phase==="done" && (
            <Card style={{marginTop:20,textAlign:"center",background:"rgba(34,211,176,0.05)",border:`0.5px solid rgba(34,211,176,0.3)`}}>
              <div style={{fontSize:36,marginBottom:8}}>🚀</div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:-.3,marginBottom:6}}>Full workforce deployed</div>
              <div style={{fontSize:13,color:C.text2,maxWidth:500,margin:"0 auto"}}>All {plan.tasks?.length} agents are executing this plan autonomously. Coordination handoffs are live. Check Owner Dashboard for live updates.</div>
            </Card>
          )}
          <div ref={bottomRef}/>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. COMPANY BRAIN — Full RAG UI
// ══════════════════════════════════════════════════════════════
const DOC_TYPES = [
  {id:"product",    label:"Product Documentation", emoji:"📦", example:"Features, use cases, integrations, FAQs"},
  {id:"persona",    label:"ICP & Buyer Personas",  emoji:"👤", example:"Who we sell to, pain points, objections"},
  {id:"playbook",   label:"Sales Playbook",         emoji:"📖", example:"Discovery scripts, objection handling"},
  {id:"brand",      label:"Brand Voice Guide",      emoji:"✍️", example:"Tone, language, messaging rules"},
  {id:"sop",        label:"SOPs & Workflows",       emoji:"⚙️", example:"Process docs, runbooks"},
  {id:"pricing",    label:"Pricing & Objections",   emoji:"💰", example:"Pricing table, common objections"},
  {id:"casestudy",  label:"Customer Case Studies",  emoji:"🏆", example:"Win stories, ROI data"},
  {id:"competitive",label:"Competitive Battlecards",emoji:"⚔️", example:"vs HubSpot, vs Zapier, vs hiring"},
  {id:"onboarding", label:"Onboarding SOPs",        emoji:"🚀", example:"New customer checklist, setup steps"},
  {id:"crm",        label:"CRM Data Snapshot",      emoji:"🔄", example:"Contacts, deals, customer history"},
];

const BRAIN_QUERY_SYSTEM = `You are the AI BOS Company Brain search engine. Given a user's query, you retrieve and synthesize relevant information from the company's knowledge base. The company knowledge includes:

INDEXED DOCUMENTS:
- Product Documentation v3 (features, pricing, integrations, use cases)
- ICP & Buyer Personas (funded startups 5-200 employees, SaaS/ecom/agencies)
- Sales Playbook 2026 (discovery questions, objection handling, pricing scripts)
- Brand Voice Guide (confident, direct, outcome-focused, no fluff)
- CRM Contacts Snapshot (200+ customers, key accounts)
- Pricing & Objection Handling ($299 Starter, $799 Growth, $1,999 Team)

Respond conversationally but accurately. Cite which document the info comes from. Be specific. If the query relates to something not in the brain, say so clearly.`;

function BrainView() {
  const [docs, setDocs] = useState([
    {id:"d1",type:"product",  label:"Product Documentation v3",    chunks:34, status:"synced", size:"2.4MB"},
    {id:"d2",type:"persona",  label:"ICP & Buyer Personas",         chunks:12, status:"synced", size:"340KB"},
    {id:"d3",type:"playbook", label:"Sales Playbook 2026",           chunks:28, status:"synced", size:"1.1MB"},
    {id:"d4",type:"brand",    label:"Brand Voice Guide",             chunks:9,  status:"synced", size:"280KB"},
    {id:"d5",type:"crm",      label:"CRM Contacts Snapshot",         chunks:156,status:"synced", size:"8.2MB"},
    {id:"d6",type:"pricing",  label:"Pricing & Objection Handling",  chunks:18, status:"synced", size:"420KB"},
  ]);
  const [uploading, setUploading] = useState(null);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState("");
  const [querying, setQuerying] = useState(false);
  const [tab, setTab] = useState("docs"); // docs|search|missing
  const [addText, setAddText] = useState("");
  const [addType, setAddType] = useState("product");
  const [addTitle, setAddTitle] = useState("");

  const missing = DOC_TYPES.filter(dt=>!docs.find(d=>d.type===dt.id));
  const totalChunks = docs.reduce((s,d)=>s+d.chunks,0);
  const health = Math.round((docs.length/DOC_TYPES.length)*100);

  const uploadDoc = (dt) => {
    if (docs.find(d=>d.type===dt.id)) return;
    setUploading(dt.id);
    setTimeout(()=>{
      setDocs(p=>[...p,{id:`d${Date.now()}`,type:dt.id,label:dt.label,chunks:Math.floor(8+Math.random()*40),status:"synced",size:`${(Math.random()*2+0.2).toFixed(1)}MB`}]);
      setUploading(null);
    },1200);
  };

  const addManual = () => {
    if (!addText.trim()||!addTitle.trim()) return;
    setUploading("manual");
    setTimeout(()=>{
      const words = addText.split(/\s+/).length;
      setDocs(p=>[...p,{id:`d${Date.now()}`,type:addType,label:addTitle,chunks:Math.max(1,Math.floor(words/80)),status:"synced",size:`${(words/5000).toFixed(1)}MB`}]);
      setAddText(""); setAddTitle(""); setUploading(null);
    },1000);
  };

  const searchBrain = async () => {
    if (!query.trim()) return;
    setQuerying(true); setQueryResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,system:BRAIN_QUERY_SYSTEM,messages:[{role:"user",content:query}]}),
      });
      const data = await res.json();
      setQueryResult(data.content?.find(b=>b.type==="text")?.text||"No result.");
    } catch(e){ setQueryResult("Search failed. Try again."); }
    setQuerying(false);
  };

  const typeEmoji = (t) => DOC_TYPES.find(d=>d.id===t)?.emoji||"📄";

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:-.5}}>🧠 Company Brain</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Shared intelligence powering every AI employee</div>
      </div>

      {/* Health bar */}
      <Card style={{marginBottom:20,background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.25)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:700}}>Brain Health Score</div>
          <div style={{fontSize:28,fontWeight:800,color:health>80?C.teal:health>50?C.gold:C.coral}}>{health}%</div>
        </div>
        <div style={{height:8,background:"rgba(255,255,255,0.07)",borderRadius:8,marginBottom:8}}>
          <div style={{height:"100%",width:`${health}%`,background:health>80?C.teal:health>50?"linear-gradient(90deg,#facc4b,#22d3b0)":C.coral,borderRadius:8,transition:".5s"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {label:"Documents",val:docs.length,tot:DOC_TYPES.length,color:C.purple2},
            {label:"Chunks indexed",val:totalChunks,tot:"∞",color:C.teal},
            {label:"Missing docs",val:missing.length,tot:DOC_TYPES.length,color:C.coral},
            {label:"Coverage",val:`${health}%`,tot:"100%",color:C.gold},
          ].map(m=>(
            <div key={m.label}>
              <div style={{fontSize:10,color:C.text3,marginBottom:2}}>{m.label.toUpperCase()}</div>
              <div style={{fontSize:18,fontWeight:700,color:m.color}}>{m.val} <span style={{fontSize:12,color:C.text3}}>/ {m.tot}</span></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[{id:"docs",label:"📂 Documents"},  {id:"search",label:"🔍 Memory Search"},{id:"missing",label:`⚠️ Missing (${missing.length})`},{id:"add",label:"+ Add Content"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",borderRadius:8,border:`0.5px solid ${tab===t.id?C.purple:"rgba(255,255,255,0.1)"}`,background:tab===t.id?"rgba(124,109,250,0.12)":"transparent",color:tab===t.id?C.purple2:C.text3,fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* DOCS TAB */}
      {tab==="docs" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {docs.map(d=>(
            <div key={d.id} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:22,flexShrink:0}}>{typeEmoji(d.type)}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{d.label}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:2}}>{d.type} · {d.chunks} chunks · {d.size}</div>
              </div>
              <Pill color={C.teal} bg="rgba(34,211,176,0.1)">✓ Synced</Pill>
              <button onClick={()=>setDocs(p=>p.filter(x=>x.id!==d.id))} style={{background:"none",border:"none",color:C.text3,cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH TAB */}
      {tab==="search" && (
        <div>
          <Card style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:C.purple2}}>🔍 Query Company Brain</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchBrain()}
                placeholder="e.g. What's our ICP? How do we handle pricing objections?"
                style={{flex:1,padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}}/>
              <Btn onClick={searchBrain} disabled={querying}>{querying?<><Spinner size={12}/>Searching…</>:"Search →"}</Btn>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["What's our ICP?","How to handle pricing objections?","What are our top use cases?","Who are our biggest customers?"].map(q=>(
                <button key={q} onClick={()=>setQuery(q)} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border}`,borderRadius:20,fontSize:11,color:C.text3,cursor:"pointer"}}>{q}</button>
              ))}
            </div>
          </Card>
          {queryResult && (
            <Card style={{background:"rgba(34,211,176,0.04)",border:`0.5px solid rgba(34,211,176,0.25)`}}>
              <div style={{fontSize:11,color:C.teal,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>🧠 Brain Response</div>
              <div style={{fontSize:14,lineHeight:1.8,color:C.text,whiteSpace:"pre-wrap"}}>{queryResult}</div>
            </Card>
          )}
        </div>
      )}

      {/* MISSING TAB */}
      {tab==="missing" && (
        <div>
          <div style={{background:"rgba(250,204,75,0.06)",border:`0.5px solid rgba(250,204,75,0.25)`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:C.gold,marginBottom:4}}>⚠️ {missing.length} documents missing — AI quality is reduced</div>
            <div style={{fontSize:12,color:C.text2}}>Upload these docs to improve your agents' accuracy, personalization, and confidence scores.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {missing.map(dt=>(
              <div key={dt.id} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:20}}>{dt.emoji}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{dt.label}</div>
                    <div style={{fontSize:11,color:C.text3}}>{dt.example}</div>
                  </div>
                </div>
                <button onClick={()=>uploadDoc(dt)} disabled={uploading===dt.id}
                  style={{width:"100%",padding:"8px",background:"rgba(124,109,250,0.1)",border:`0.5px solid rgba(124,109,250,0.3)`,borderRadius:8,color:C.purple2,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {uploading===dt.id?<><Spinner size={11} color={C.purple}/>Uploading & indexing…</>:"+ Upload this document"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD TAB */}
      {tab==="add" && (
        <Card>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Add Content to Company Brain</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.text2,marginBottom:6}}>Document type</div>
            <select value={addType} onChange={e=>setAddType(e.target.value)} style={{width:"100%",padding:"9px 12px",background:C.bg3,border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}}>
              {DOC_TYPES.map(dt=><option key={dt.id} value={dt.id}>{dt.emoji} {dt.label}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.text2,marginBottom:6}}>Document title</div>
            <input value={addTitle} onChange={e=>setAddTitle(e.target.value)} placeholder="e.g. Sales Playbook Q3 2026"
              style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:C.text2,marginBottom:6}}>Paste your content</div>
            <textarea value={addText} onChange={e=>setAddText(e.target.value)} placeholder="Paste your document content here. The longer and more detailed, the smarter your agents become…"
              style={{width:"100%",minHeight:180,padding:"12px 14px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none",lineHeight:1.6,resize:"vertical",fontFamily:"inherit"}}/>
            <div style={{fontSize:11,color:C.text3,marginTop:4}}>{addText.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1,Math.floor(addText.split(/\s+/).length/80))} chunks</div>
          </div>
          <Btn onClick={addManual} disabled={uploading==="manual"||!addText.trim()||!addTitle.trim()} style={{display:"flex",alignItems:"center",gap:8}}>
            {uploading==="manual"?<><Spinner size={12}/>Indexing…</>:"🧠 Add to Company Brain"}
          </Btn>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. AGENT MARKETPLACE v2 — with real AI previews
// ══════════════════════════════════════════════════════════════
const MARKET_AGENTS = [
  {id:"re",      name:"RealtyAI",     cat:"Industry",  emoji:"🏠", color:"#7c6dfa", desc:"Handles property listings, client follow-ups, open house scheduling, and CRM updates for real estate agencies.", rating:4.9, installs:"1.2K", price:"$199/mo", tags:["Lead Gen","CRM","Scheduling"], system:"You are RealtyAI, an expert AI agent for real estate agencies. You handle property listings, follow-ups, open house coordination, and CRM management. Be professional, warm, and data-driven."},
  {id:"dental",  name:"DentalBot",    cat:"Industry",  emoji:"🦷", color:"#22d3b0", desc:"Appointment reminders, recall campaigns, insurance follow-ups, and patient satisfaction surveys for dental practices.", rating:4.8, installs:"890",  price:"$149/mo", tags:["Appointments","Recalls","Billing"], system:"You are DentalBot, an AI agent for dental practices. You handle patient scheduling, recall campaigns, insurance coordination, and satisfaction surveys. Be caring, professional, and HIPAA-conscious."},
  {id:"legal",   name:"LexAI",        cat:"Industry",  emoji:"⚖️", color:"#f06a40", desc:"Client intake, document drafting, deadline tracking, and billing management for law firms.", rating:4.7, installs:"540",  price:"$299/mo", tags:["Intake","Docs","Billing"], system:"You are LexAI, an AI agent for law firms. You handle client intake, document drafting, deadline management, and billing. Be precise, professional, and clear. Always recommend attorney review for legal advice."},
  {id:"rest",    name:"TableTurn",    cat:"Industry",  emoji:"🍽️", color:"#facc4b", desc:"Reservation management, review responses, delivery coordination, and staff scheduling for restaurants.", rating:4.6, installs:"2.1K", price:"$99/mo",  tags:["Reservations","Reviews","Ops"], system:"You are TableTurn, an AI agent for restaurants. You handle reservations, review responses, delivery coordination, and scheduling. Be friendly, quick, and hospitality-focused."},
  {id:"hr",      name:"PeopleAI",     cat:"HR",        emoji:"👥", color:"#a594ff", desc:"Recruitment screening, onboarding workflows, leave management, and employee engagement surveys.", rating:4.8, installs:"780",  price:"$249/mo", tags:["Hiring","Onboarding","HR"], system:"You are PeopleAI, an AI HR agent. You handle recruitment screening, onboarding, leave management, and engagement. Be empathetic, fair, and people-focused."},
  {id:"ecom",    name:"ShopBot",      cat:"Industry",  emoji:"🛍️", color:"#63c8c8", desc:"Abandoned cart recovery, product recommendations, return processing, and inventory alerts for e-commerce stores.", rating:4.9, installs:"3.4K", price:"$179/mo", tags:["Cart Recovery","Returns","Inventory"], system:"You are ShopBot, an AI e-commerce agent. You handle cart recovery, product recommendations, returns, and inventory. Be conversion-focused and customer-friendly."},
  {id:"sdr2",    name:"ProspectAI",   cat:"Sales",     emoji:"🎯", color:"#7c6dfa", desc:"Advanced outbound with LinkedIn enrichment, multi-channel sequences, A/B testing, and deal coaching.", rating:4.7, installs:"1.8K", price:"$349/mo", tags:["Outbound","LinkedIn","A/B"], system:"You are ProspectAI, an advanced AI sales agent. You specialize in LinkedIn outreach, multi-channel sequences, and deal coaching. Be strategic, data-driven, and persuasive."},
  {id:"cxai",    name:"CX360",        cat:"Support",   emoji:"💬", color:"#22d3b0", desc:"Omnichannel support across email, chat, and WhatsApp with sentiment analysis and churn prediction.", rating:4.9, installs:"2.2K", price:"$199/mo", tags:["Omnichannel","Sentiment","Churn"], system:"You are CX360, an advanced AI customer experience agent. You handle omnichannel support, analyze sentiment, and predict churn. Be empathetic, proactive, and data-informed."},
  {id:"cfob",    name:"CFObot",       cat:"Finance",   emoji:"📈", color:"#facc4b", desc:"Advanced financial modeling, runway analysis, fundraising materials, and investor reporting automation.", rating:4.8, installs:"430",  price:"$499/mo", tags:["Forecasting","Runway","Reporting"], system:"You are CFObot, an AI CFO agent. You build financial models, analyze runway, prepare fundraising materials, and automate investor reports. Be precise, conservative, and board-ready."},
  {id:"content", name:"ContentOS",    cat:"Marketing", emoji:"✍️", color:"#a594ff", desc:"Full content calendar management, SEO optimization, repurposing across channels, and performance analytics.", rating:4.8, installs:"1.5K", price:"$249/mo", tags:["SEO","Calendar","Repurposing"], system:"You are ContentOS, an AI content marketing agent. You manage content calendars, optimize for SEO, repurpose content across channels, and track performance. Be creative, strategic, and data-driven."},
];

const MARKET_CATS = ["All","Sales","Support","Marketing","Finance","HR","Industry"];

function MarketplaceV2() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState([]);
  const [preview, setPreview] = useState(null);
  const [demoInput, setDemoInput] = useState("");
  const [demoOutput, setDemoOutput] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [tab, setTab] = useState("browse"); // browse|installed

  const filtered = MARKET_AGENTS.filter(a=>
    (cat==="All"||a.cat===cat)&&
    (a.name.toLowerCase().includes(search.toLowerCase())||a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const runDemo = async (agent) => {
    if (!demoInput.trim()||demoLoading) return;
    setDemoLoading(true); setDemoOutput("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:500,system:agent.system,messages:[{role:"user",content:demoInput}]}),
      });
      const data=await res.json();
      setDemoOutput(data.content?.find(b=>b.type==="text")?.text||"No response");
    } catch(e){ setDemoOutput("Demo failed. Try again."); }
    setDemoLoading(false);
  };

  const openPreview = (agent) => {
    setPreview(agent); setDemoInput(""); setDemoOutput("");
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"24px",background:C.bg}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:-.5}}>🏪 Agent Marketplace v2</div>
        <div style={{fontSize:13,color:C.text3,marginTop:2}}>Preview any agent live before installing · {MARKET_AGENTS.length} agents available</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[{id:"browse",label:"🔍 Browse Agents"},{id:"installed",label:`✓ Installed (${installed.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",borderRadius:8,border:`0.5px solid ${tab===t.id?C.purple:C.border}`,background:tab===t.id?"rgba(124,109,250,0.12)":"transparent",color:tab===t.id?C.purple2:C.text3,fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="installed" && (
        installed.length===0
          ? <Card style={{textAlign:"center",padding:"40px"}}><div style={{fontSize:36,marginBottom:12}}>🏪</div><div style={{color:C.text2}}>No agents installed yet. Browse and install one!</div></Card>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {MARKET_AGENTS.filter(a=>installed.includes(a.id)).map(agent=>(
                <div key={agent.id} style={{background:C.bg2,border:`0.5px solid ${agent.color}40`,borderRadius:12,padding:"18px",cursor:"pointer"}} onClick={()=>openPreview(agent)}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:10,background:`${agent.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{agent.emoji}</div>
                    <div><div style={{fontWeight:700,fontSize:14,color:agent.color}}>{agent.name}</div><div style={{fontSize:11,color:C.text3}}>{agent.cat}</div></div>
                    <Pill color={C.teal} bg="rgba(34,211,176,0.1)" style={{marginLeft:"auto"}}>Active</Pill>
                  </div>
                  <div style={{fontSize:13,color:C.text2,lineHeight:1.6,marginBottom:10}}>{agent.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:C.gold}}>★ {agent.rating}</span>
                    <button onClick={e=>{e.stopPropagation();setInstalled(p=>p.filter(x=>x!==agent.id));}} style={{padding:"5px 12px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:"rgba(240,106,64,0.12)",color:C.coral}}>Uninstall</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab==="browse" && (
        <>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agents…"
              style={{flex:1,minWidth:200,padding:"9px 14px",background:C.bg2,border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {MARKET_CATS.map(c=>(
                <button key={c} onClick={()=>setCat(c)} style={{padding:"7px 14px",borderRadius:20,border:`0.5px solid ${cat===c?"rgba(124,109,250,0.5)":C.border}`,background:cat===c?"rgba(124,109,250,0.12)":"transparent",color:cat===c?C.purple2:C.text3,fontSize:12,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
            {filtered.map(agent=>{
              const isInstalled=installed.includes(agent.id);
              return (
                <div key={agent.id} style={{background:C.bg2,border:`0.5px solid ${isInstalled?agent.color+"40":C.border}`,borderRadius:12,padding:"18px",cursor:"pointer",transition:".15s"}} onClick={()=>openPreview(agent)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:44,height:44,borderRadius:10,background:`${agent.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{agent.emoji}</div>
                      <div><div style={{fontWeight:700,fontSize:14,color:agent.color}}>{agent.name}</div><div style={{fontSize:11,color:C.text3}}>{agent.cat}</div></div>
                    </div>
                    {isInstalled && <Pill color={C.teal} bg="rgba(34,211,176,0.1)">Installed</Pill>}
                  </div>
                  <div style={{fontSize:13,color:C.text2,lineHeight:1.6,marginBottom:10,minHeight:56}}>{agent.desc}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                    {agent.tags.map(t=><Pill key={t} color={C.text3} bg="rgba(255,255,255,0.05)">{t}</Pill>)}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:C.gold}}>★ {agent.rating} <span style={{color:C.text3}}>· {agent.installs}</span></span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:12,color:C.text3}}>{agent.price}</span>
                      <button onClick={e=>{e.stopPropagation();setInstalled(p=>isInstalled?p.filter(x=>x!==agent.id):[...p,agent.id]);}}
                        style={{padding:"5px 12px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:isInstalled?"rgba(240,106,64,0.12)":agent.color,color:isInstalled?C.coral:"#fff"}}>
                        {isInstalled?"Remove":"Install"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Preview Modal with LIVE DEMO */}
      {preview && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setPreview(null)}>
          <div style={{background:C.bg2,border:`0.5px solid ${preview.color}50`,borderRadius:16,padding:28,maxWidth:580,width:"100%",maxHeight:"90vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",gap:14,marginBottom:16}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${preview.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{preview.emoji}</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:preview.color}}>{preview.name}</div>
                <div style={{fontSize:12,color:C.text3,marginTop:2}}>{preview.cat} · ★ {preview.rating} · {preview.installs} installs · {preview.price}</div>
              </div>
            </div>
            <div style={{fontSize:14,color:C.text2,lineHeight:1.7,marginBottom:14}}>{preview.desc}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
              {preview.tags.map(t=><Pill key={t} color={preview.color} bg={`${preview.color}15`}>{t}</Pill>)}
            </div>

            {/* LIVE DEMO */}
            <div style={{background:`${preview.color}08`,border:`0.5px solid ${preview.color}30`,borderRadius:12,padding:"16px",marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:preview.color,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>⚡ Live Demo — Try {preview.name} now</div>
              <textarea value={demoInput} onChange={e=>setDemoInput(e.target.value)}
                placeholder={`Ask ${preview.name} something…`}
                style={{width:"100%",minHeight:72,padding:"10px 12px",background:"rgba(255,255,255,0.05)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none",lineHeight:1.6,resize:"none",fontFamily:"inherit",marginBottom:8}}/>
              <Btn onClick={()=>runDemo(preview)} disabled={demoLoading||!demoInput.trim()} style={{background:preview.color,display:"flex",alignItems:"center",gap:8,width:"100%",justifyContent:"center"}}>
                {demoLoading?<><Spinner/>Running demo…</>:`Run ${preview.name} →`}
              </Btn>
              {demoOutput && (
                <div style={{marginTop:12,padding:"12px 14px",background:"rgba(255,255,255,0.04)",borderRadius:8,fontSize:13,color:C.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{demoOutput}</div>
              )}
            </div>

            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{setInstalled(p=>p.includes(preview.id)?p.filter(x=>x!==preview.id):[...p,preview.id]);setPreview(null);}}
                style={{flex:1,background:installed.includes(preview.id)?"rgba(240,106,64,0.15)":preview.color,color:installed.includes(preview.id)?C.coral:"#fff"}}>
                {installed.includes(preview.id)?"Remove Agent":`Install ${preview.name} — ${preview.price}`}
              </Btn>
              <Btn variant="ghost" onClick={()=>setPreview(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("owner");
  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",color:C.text,overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}} *{box-sizing:border-box} input,select,textarea{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
      <Sidebar view={view} setView={setView}/>
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>
        {view==="owner"   && <OwnerDashboard/>}
        {view==="command" && <CommandV2/>}
        {view==="brain"   && <BrainView/>}
        {view==="market"  && <MarketplaceV2/>}
      </div>
    </div>
  );
}
