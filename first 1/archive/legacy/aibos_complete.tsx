import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#0a0a0f",bg2:"#0d0d14",bg3:"#111118",bg4:"#16161f",
  border:"rgba(255,255,255,0.06)",border2:"rgba(255,255,255,0.1)",border3:"rgba(255,255,255,0.15)",
  text:"#f0f0f8",text2:"#9b9bb8",text3:"#6b6b88",
  purple:"#7c6dfa",purple2:"#a594ff",
  teal:"#22d3b0",coral:"#f06a40",gold:"#facc4b",green:"#4ade80",
  grad:"linear-gradient(135deg,#7c6dfa 0%,#22d3b0 100%)",
};

const Pill=({children,color=C.purple2,bg="rgba(124,109,250,0.12)",style={}})=>(
  <span style={{padding:"2px 10px",borderRadius:20,background:bg,color,fontSize:11,fontWeight:600,...style}}>{children}</span>
);
const Card=({children,style={}})=>(
  <div style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"16px 18px",...style}}>{children}</div>
);
const Btn=({children,onClick,variant="primary",style={},disabled=false})=>{
  const v={
    primary:{background:C.purple,color:"#fff",border:"none"},
    ghost:{background:"rgba(255,255,255,0.05)",color:C.text2,border:`0.5px solid ${C.border2}`},
    teal:{background:C.teal,color:"#fff",border:"none"},
    danger:{background:"rgba(240,106,64,0.12)",color:C.coral,border:`0.5px solid rgba(240,106,64,0.3)`},
    success:{background:"rgba(74,222,128,0.12)",color:C.green,border:`0.5px solid rgba(74,222,128,0.3)`},
  };
  return <button onClick={onClick} disabled={disabled} style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:".15s",opacity:disabled?.5:1,...v[variant],...style}}>{children}</button>;
};
const Spin=({size=13,color="#fff"})=>(
  <span style={{display:"inline-block",width:size,height:size,border:`2px solid rgba(255,255,255,0.2)`,borderTopColor:color,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
);
const Badge=({children,type="default"})=>{
  const t={default:{bg:"rgba(155,155,184,0.12)",c:C.text2},success:{bg:"rgba(74,222,128,0.12)",c:C.green},warning:{bg:"rgba(250,204,75,0.12)",c:C.gold},danger:{bg:"rgba(240,106,64,0.12)",c:C.coral},info:{bg:"rgba(124,109,250,0.12)",c:C.purple2}};
  const s=t[type]||t.default;
  return <span style={{padding:"2px 8px",borderRadius:6,background:s.bg,color:s.c,fontSize:11,fontWeight:600}}>{children}</span>;
};

const AGENTS=[
  {id:"aria",name:"Aria",role:"Sales SDR",emoji:"📊",color:"#7c6dfa",bg:"rgba(124,109,250,0.15)"},
  {id:"marcus",name:"Marcus",role:"Support",emoji:"🎧",color:"#22d3b0",bg:"rgba(34,211,176,0.15)"},
  {id:"lexi",name:"Lexi",role:"Marketing",emoji:"📣",color:"#f06a40",bg:"rgba(240,106,64,0.15)"},
  {id:"felix",name:"Felix",role:"Finance",emoji:"💰",color:"#facc4b",bg:"rgba(250,204,75,0.15)"},
  {id:"nova",name:"Nova",role:"Operations",emoji:"⚙️",color:"#63c8c8",bg:"rgba(99,200,200,0.15)"},
];

const NAV_SECTIONS=[
  {label:"MAIN",items:[
    {id:"command",icon:"⚡",label:"Command Center"},
    {id:"dashboard",icon:"⬛",label:"Dashboard"},
  ]},
  {label:"HUBS",items:[
    {id:"sales",icon:"📊",label:"Sales Hub"},
    {id:"marketing",icon:"📣",label:"Marketing Hub"},
    {id:"support",icon:"🎧",label:"Support Hub"},
    {id:"finance",icon:"💰",label:"Finance Hub"},
    {id:"operations",icon:"⚙️",label:"Operations Hub"},
  ]},
  {label:"PLATFORM",items:[
    {id:"notifications",icon:"🔔",label:"Notifications",badge:7},
    {id:"integrations",icon:"🔌",label:"Integrations"},
    {id:"billing",icon:"💳",label:"Billing"},
    {id:"developer",icon:"🛠️",label:"Developer"},
    {id:"settings",icon:"⚙️",label:"Settings"},
  ]},
];

function Sidebar({view,setView}){
  return(
    <div style={{width:210,background:C.bg2,borderRight:`0.5px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,padding:"0 8px",overflowY:"auto"}}>
      <div style={{padding:"14px 8px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`0.5px solid ${C.border}`,marginBottom:8}}>
        <div style={{width:26,height:26,background:C.grad,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>B</div>
        <span style={{fontWeight:700,fontSize:14,letterSpacing:-.3}}>AI BOS</span>
        <Pill color={C.teal} bg="rgba(34,211,176,0.12)" style={{fontSize:10}}>v2</Pill>
      </div>
      {NAV_SECTIONS.map(sec=>(
        <div key={sec.label}>
          <div style={{fontSize:9,color:C.text3,letterSpacing:.8,textTransform:"uppercase",padding:"10px 10px 4px"}}>{sec.label}</div>
          {sec.items.map(n=>(
            <div key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,background:view===n.id?"rgba(124,109,250,0.12)":"transparent",color:view===n.id?C.purple2:C.text3,fontSize:12,fontWeight:view===n.id?600:400,border:view===n.id?`0.5px solid rgba(124,109,250,0.25)`:"0.5px solid transparent"}}>
              <span style={{fontSize:13}}>{n.icon}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.badge&&<span style={{background:C.coral,color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:10}}>{n.badge}</span>}
              {view===n.id&&<div style={{width:5,height:5,borderRadius:"50%",background:C.teal}}/>}
            </div>
          ))}
        </div>
      ))}
      <div style={{marginTop:"auto",padding:"10px 8px",borderTop:`0.5px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.text3,marginBottom:5}}>Brain Health · 74%</div>
        <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:3}}>
          <div style={{height:"100%",width:"74%",background:C.grad,borderRadius:3}}/>
        </div>
      </div>
    </div>
  );
}

// ── COMMAND CENTER v3 ─────────────────────────────────
const CMD_SYS=`You are AI BOS Command Intelligence — the central brain of an AI Business Operating System.

When given a business goal, respond ONLY with valid JSON (no markdown):
{
  "goal": "restate clearly",
  "summary": "2-sentence executive summary",
  "timeline": "e.g. 2 weeks",
  "expectedImpact": "quantified outcome",
  "confidence": 85,
  "totalTasks": 5,
  "crossDeps": ["Aria → Nova: deal handoff after close"],
  "tasks": [
    {
      "agentId": "aria|marcus|lexi|felix|nova",
      "priority": "critical|high|medium",
      "title": "short title",
      "description": "detailed what and why",
      "actions": ["action 1","action 2","action 3"],
      "kpi": "success metric",
      "timeframe": "48 hours",
      "estimatedValue": "$12K pipeline",
      "handoffTo": "nova|null"
    }
  ]
}

COMPANY: AI BOS · Plans: $299/$799/$1,999/mo · MRR: $47,200 · ICP: funded startups 5-200 employees`;

const AGENT_PROMPTS={
  aria:`You are Aria, elite AI Sales SDR for AI BOS. Be specific, human, produce one concrete output (email/plan). AI BOS plans: $299/$799/$1,999/mo. ICP: funded startups 5-200 employees.`,
  marcus:`You are Marcus, AI Support specialist for AI BOS. Empathetic, solution-focused, proactive about churn. Produce one concrete action.`,
  lexi:`You are Lexi, AI Marketing Manager for AI BOS. Bold, direct, outcome-focused. Produce one concrete deliverable.`,
  felix:`You are Felix, AI Finance Analyst for AI BOS. Numbers first. Structure: Summary → Signals → Recommendation.`,
  nova:`You are Nova, AI Operations Lead for AI BOS. Coordinate across agents. Produce a specific cross-functional action plan.`,
};

function CommandV3(){
  const [cmd,setCmd]=useState("");
  const [phase,setPhase]=useState("idle");
  const [plan,setPlan]=useState(null);
  const [steps,setSteps]=useState([]);
  const [outputs,setOutputs]=useState({});
  const [running,setRunning]=useState(null);
  const [done,setDone]=useState({});
  const [err,setErr]=useState("");
  const [execPhase,setExecPhase]=useState("idle");

  const THINKING=["Analyzing business goal…","Querying Company Brain…","Mapping cross-department dependencies…","Assigning tasks to AI employees…","Calculating expected impact…","Building execution plan…"];

  const generate=async()=>{
    if(!cmd.trim())return;
    setPhase("planning");setPlan(null);setOutputs({});setDone({});setErr("");setSteps([]);
    for(let i=0;i<THINKING.length;i++){await new Promise(r=>setTimeout(r,380));setSteps(p=>[...p,THINKING[i]]);}
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,system:CMD_SYS,messages:[{role:"user",content:cmd}]})});
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      setPlan(JSON.parse(text.replace(/```json|```/g,"").trim()));
      setPhase("ready");
    }catch(e){setErr("Failed to generate plan. Try again.");setPhase("idle");}
  };

  const runAgent=async(task,idx)=>{
    if(running!==null)return;
    setRunning(idx);
    const a=AGENTS.find(x=>x.id===task.agentId)||AGENTS[0];
    try{
      const prompt=`GOAL: ${plan.goal}\nTASK: ${task.title}\n${task.description}\nACTIONS:\n${task.actions.map((a,i)=>`${i+1}. ${a}`).join("\n")}\nKPI: ${task.kpi}\nTIMEFRAME: ${task.timeframe}\n\nProvide: 1) Your execution approach (2-3 sentences) 2) ONE concrete deliverable 3) What you hand off next`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:700,system:AGENT_PROMPTS[task.agentId]||AGENT_PROMPTS.nova,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      setOutputs(p=>({...p,[idx]:data.content?.find(b=>b.type==="text")?.text||""}));
      setDone(p=>({...p,[idx]:true}));
    }catch(e){setOutputs(p=>({...p,[idx]:"Error. Try again."}));}
    setRunning(null);
  };

  const runAll=async()=>{
    setExecPhase("running");
    for(let i=0;i<plan.tasks.length;i++){if(!done[i])await runAgent(plan.tasks[i],i);await new Promise(r=>setTimeout(r,200));}
    setExecPhase("done");
  };

  const pc=p=>p==="critical"?C.coral:p==="high"?C.gold:C.teal;

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>⚡ Command Center v3</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>One goal → entire company executes · real-time streaming</div>
      </div>
      <Card style={{marginBottom:16,background:"rgba(124,109,250,0.05)",border:`0.5px solid rgba(124,109,250,0.3)`}}>
        <textarea value={cmd} onChange={e=>setCmd(e.target.value)} placeholder="e.g. Increase revenue by 20% this quarter…" style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:13,lineHeight:1.6,resize:"none",minHeight:68,outline:"none",fontFamily:"inherit"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Increase revenue 20%","Reduce churn — 3 at-risk customers","Launch new feature campaign","Close 5 stalled deals","Hire and onboard 10 new customers"].map((ex,i)=>(
              <button key={i} onClick={()=>setCmd(ex)} style={{padding:"3px 9px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border}`,borderRadius:20,fontSize:11,color:C.text3,cursor:"pointer"}}>{ex}</button>
            ))}
          </div>
          <Btn onClick={generate} disabled={phase==="planning"||!cmd.trim()} style={{display:"flex",alignItems:"center",gap:6,minWidth:150,justifyContent:"center"}}>
            {phase==="planning"?<><Spin/>Generating…</>:"⚡ Generate Plan"}
          </Btn>
        </div>
      </Card>
      {err&&<div style={{color:C.coral,fontSize:13,marginBottom:12}}>{err}</div>}
      {phase==="planning"&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:C.purple2,marginBottom:10}}>🧠 Command Intelligence thinking…</div>
          {steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,color:C.text2,fontSize:12,marginBottom:6}}><span style={{color:C.teal,fontWeight:700}}>✓</span>{s}</div>)}
          {steps.length<THINKING.length&&<div style={{display:"flex",alignItems:"center",gap:8,color:C.text3,fontSize:12}}><Spin size={11} color={C.purple}/>{THINKING[steps.length]}</div>}
        </Card>
      )}
      {plan&&(
        <div>
          <Card style={{marginBottom:14,background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.3)`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,letterSpacing:-.3,marginBottom:6}}>{plan.goal}</div>
                <div style={{fontSize:12,color:C.text2,lineHeight:1.6,marginBottom:8}}>{plan.summary}</div>
                {plan.crossDeps?.length>0&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {plan.crossDeps.map((d,i)=><span key={i} style={{fontSize:11,color:C.purple2,background:"rgba(124,109,250,0.1)",borderRadius:6,padding:"2px 8px"}}>→ {d}</span>)}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
                {[{l:"Timeline",v:plan.timeline,c:C.teal},{l:"Impact",v:plan.expectedImpact,c:C.purple2},{l:"Confidence",v:`${plan.confidence}%`,c:C.gold}].map(m=>(
                  <div key={m.l} style={{textAlign:"center",padding:"8px 14px",background:`${m.c}12`,borderRadius:8,border:`0.5px solid ${m.c}30`}}>
                    <div style={{fontSize:9,color:C.text3,marginBottom:2}}>{m.l.toUpperCase()}</div>
                    <div style={{fontSize:12,fontWeight:700,color:m.c}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
            {execPhase==="idle"&&<div style={{marginTop:12,display:"flex",gap:8}}><Btn onClick={runAll} style={{background:C.grad,border:"none",display:"flex",alignItems:"center",gap:6}}>🚀 Execute All Agents</Btn><Btn variant="ghost">📋 Export</Btn></div>}
            {execPhase==="running"&&<div style={{marginTop:10,fontSize:12,color:C.purple2,display:"flex",alignItems:"center",gap:8}}><Spin color={C.purple}/>Executing across {plan.tasks.length} agents…</div>}
            {execPhase==="done"&&<div style={{marginTop:10,fontSize:12,color:C.teal,fontWeight:600}}>✓ Full workforce deployed — all agents executing</div>}
          </Card>
          <div style={{fontSize:10,color:C.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>{plan.tasks?.length} Agent Tasks</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {plan.tasks?.map((task,i)=>{
              const a=AGENTS.find(x=>x.id===task.agentId)||AGENTS[0];
              const isRunning=running===i;const isDone=!!done[i];const out=outputs[i];
              return(
                <Card key={i} style={{border:`0.5px solid ${a.color}30`,background:isDone?"rgba(34,211,176,0.02)":C.bg2}}>
                  <div style={{display:"flex",gap:10}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{a.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:5}}>
                        <span style={{fontWeight:700,color:a.color,fontSize:13}}>{a.name}</span>
                        <Pill color={pc(task.priority)} bg={`${pc(task.priority)}18`}>{task.priority}</Pill>
                        <span style={{fontSize:10,color:C.text3}}>⏱ {task.timeframe}</span>
                        {task.estimatedValue&&<Pill color={C.gold} bg="rgba(250,204,75,0.1)">{task.estimatedValue}</Pill>}
                        {isDone&&<Pill color={C.teal} bg="rgba(34,211,176,0.12)">✓ Executed</Pill>}
                        {task.handoffTo&&task.handoffTo!=="null"&&<Pill color={C.purple2} bg="rgba(124,109,250,0.1)">→ {task.handoffTo}</Pill>}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{task.title}</div>
                      <div style={{fontSize:12,color:C.text2,marginBottom:8,lineHeight:1.5}}>{task.description}</div>
                      <div style={{marginBottom:8}}>{task.actions?.map((ac,j)=><div key={j} style={{display:"flex",gap:6,fontSize:11,color:C.text2,marginBottom:3}}><span style={{color:a.color,fontWeight:700}}>→</span>{ac}</div>)}</div>
                      <div style={{fontSize:10,color:C.text3,marginBottom:8}}>KPI: <span style={{color:C.gold}}>{task.kpi}</span></div>
                      {isRunning&&<div style={{background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:8,padding:"10px 12px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6,color:C.purple2,fontSize:11}}><Spin size={11} color={C.purple}/>{a.name} is executing…</div></div>}
                      {out&&<div style={{background:`${a.color}08`,border:`0.5px solid ${a.color}30`,borderRadius:8,padding:"12px 14px",marginBottom:8}}><div style={{fontSize:10,color:a.color,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>{a.name}'s Output</div><div style={{fontSize:12,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{out}</div></div>}
                      {!isDone&&!isRunning&&<Btn onClick={()=>runAgent(task,i)} disabled={running!==null} style={{fontSize:11,padding:"5px 12px",background:a.color}}>Run {a.name} →</Btn>}
                      {isDone&&<span style={{fontSize:11,color:C.teal}}>✓ Agent deployed</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {execPhase==="done"&&(
            <Card style={{marginTop:16,textAlign:"center",background:"rgba(34,211,176,0.05)",border:`0.5px solid rgba(34,211,176,0.3)`}}>
              <div style={{fontSize:28,marginBottom:6}}>🚀</div>
              <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Full workforce deployed</div>
              <div style={{fontSize:12,color:C.text2}}>All {plan.tasks?.length} agents executing autonomously. Check Dashboard for live updates.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── SALES HUB ─────────────────────────────────────────
const LEADS_DATA=[
  {id:1,name:"Jordan Blake",company:"TechFlow",title:"VP Engineering",email:"jordan@techflow.io",score:94,stage:"Meeting",value:1999,source:"LinkedIn",last:"2h ago"},
  {id:2,name:"Sarah Chen",company:"Nexus AI",title:"CEO",email:"sarah@nexusai.co",score:87,stage:"Proposal",value:1999,source:"Outbound",last:"1d ago"},
  {id:3,name:"Marcus Reid",company:"FlowStack",title:"COO",email:"m.reid@flowstack.com",score:82,stage:"Contacted",value:799,source:"Website",last:"3h ago"},
  {id:4,name:"Priya Sharma",company:"Orbis Labs",title:"Head of Ops",email:"priya@orbis.io",score:91,stage:"Discovery",value:1999,source:"Referral",last:"5h ago"},
  {id:5,name:"Alex Kovacs",company:"Clearpath",title:"Founder",email:"alex@clearpath.ai",score:76,stage:"New",value:299,source:"Cold Email",last:"2d ago"},
  {id:6,name:"Mei Lin",company:"Vantage",title:"CTO",email:"mei@vantage.io",score:88,stage:"Closed",value:799,source:"LinkedIn",last:"1w ago"},
];
const STAGES=["New","Contacted","Discovery","Meeting","Proposal","Closed"];

function SalesHub(){
  const [view,setView]=useState("pipeline");
  const [leads,setLeads]=useState(LEADS_DATA);
  const [selected,setSelected]=useState(null);
  const [drafting,setDrafting]=useState(false);
  const [draft,setDraft]=useState("");
  const [taskInput,setTaskInput]=useState("");

  const scoreColor=s=>s>=90?C.teal:s>=75?C.gold:C.coral;
  const stageColor=s=>({New:C.text3,Contacted:C.purple2,Discovery:C.gold,Meeting:C.teal,Proposal:C.coral,Closed:C.green}[s]||C.text3);

  const draftEmail=async(lead)=>{
    setDrafting(true);setDraft("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,system:"You are Aria, elite AI SDR for AI BOS (AI Business Operating System, $299-$1,999/mo). Write a sharp, personalized cold email under 120 words. No fluff. Focus on their specific pain.",messages:[{role:"user",content:`Draft a personalized cold email to ${lead.name}, ${lead.title} at ${lead.company}. Lead score: ${lead.score}/100. Source: ${lead.source}.`}]})});
      const data=await res.json();
      setDraft(data.content?.find(b=>b.type==="text")?.text||"");
    }catch(e){setDraft("Error generating email.");}
    setDrafting(false);
  };

  const pipeline=STAGES.map(s=>({stage:s,leads:leads.filter(l=>l.stage===s)}));
  const totalPipeline=leads.filter(l=>l.stage!=="Closed").reduce((s,l)=>s+l.value,0);

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>📊 Sales Hub</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Aria manages your entire pipeline</div></div>
        <div style={{display:"flex",gap:8}}>
          {["pipeline","leads","outreach","proposals"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",borderRadius:8,border:`0.5px solid ${view===v?C.purple:C.border}`,background:view===v?"rgba(124,109,250,0.12)":"transparent",color:view===v?C.purple2:C.text3,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Pipeline Value",v:`$${totalPipeline.toLocaleString()}`,c:C.teal},{l:"Active Leads",v:leads.filter(l=>l.stage!=="Closed"&&l.stage!=="New").length,c:C.purple2},{l:"Meetings Set",v:leads.filter(l=>l.stage==="Meeting").length,c:C.gold},{l:"Closed Won",v:leads.filter(l=>l.stage==="Closed").length,c:C.green}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>

      {view==="pipeline"&&(
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",gap:10,minWidth:900}}>
            {pipeline.map(col=>(
              <div key={col.stage} style={{flex:1,minWidth:140}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:stageColor(col.stage)}}>{col.stage}</span>
                  <span style={{fontSize:10,color:C.text3}}>{col.leads.length}</span>
                </div>
                {col.leads.map(l=>(
                  <div key={l.id} onClick={()=>setSelected(l)} style={{background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",marginBottom:8,cursor:"pointer"}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{l.name}</div>
                    <div style={{fontSize:10,color:C.text3,marginBottom:6}}>{l.company}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:C.gold}}>${l.value}/mo</span>
                      <span style={{fontSize:10,fontWeight:700,color:scoreColor(l.score)}}>{l.score}</span>
                    </div>
                  </div>
                ))}
                {col.leads.length===0&&<div style={{border:`0.5px dashed ${C.border}`,borderRadius:8,padding:"20px",textAlign:"center",fontSize:10,color:C.text3}}>Drop here</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view==="leads"&&(
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Name","Company","Title","Score","Stage","Value","Last Activity","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:C.text3,padding:"6px 10px",borderBottom:`0.5px solid ${C.border}`,letterSpacing:.5}}>{h}</th>)}</tr></thead>
            <tbody>
              {leads.map(l=>(
                <tr key={l.id} style={{borderBottom:`0.5px solid ${C.border}`}}>
                  <td style={{padding:"10px",fontSize:13,fontWeight:600}}>{l.name}</td>
                  <td style={{padding:"10px",fontSize:12,color:C.text2}}>{l.company}</td>
                  <td style={{padding:"10px",fontSize:12,color:C.text3}}>{l.title}</td>
                  <td style={{padding:"10px"}}><span style={{fontSize:12,fontWeight:700,color:scoreColor(l.score)}}>{l.score}</span></td>
                  <td style={{padding:"10px"}}><Badge type={l.stage==="Closed"?"success":l.stage==="Proposal"?"warning":"info"}>{l.stage}</Badge></td>
                  <td style={{padding:"10px",fontSize:12,color:C.gold}}>${l.value}/mo</td>
                  <td style={{padding:"10px",fontSize:11,color:C.text3}}>{l.last}</td>
                  <td style={{padding:"10px"}}><button onClick={()=>{setSelected(l);setView("leads");}} style={{fontSize:11,padding:"4px 10px",background:"rgba(124,109,250,0.1)",border:`0.5px solid rgba(124,109,250,0.3)`,borderRadius:6,color:C.purple2,cursor:"pointer"}}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view==="outreach"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:12,color:C.text3,marginBottom:10}}>Select a lead to draft outreach:</div>
            {leads.filter(l=>l.stage==="New"||l.stage==="Contacted").map(l=>(
              <div key={l.id} onClick={()=>setSelected(l)} style={{background:C.bg2,border:`0.5px solid ${selected?.id===l.id?C.purple:C.border}`,borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{l.name}</span>
                  <span style={{fontSize:10,color:scoreColor(l.score),fontWeight:700}}>{l.score}</span>
                </div>
                <div style={{fontSize:11,color:C.text3}}>{l.title} · {l.company}</div>
              </div>
            ))}
          </div>
          <div>
            {selected?(
              <Card>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:C.purple2}}>Draft for {selected.name}</div>
                <Btn onClick={()=>draftEmail(selected)} disabled={drafting} style={{marginBottom:12,width:"100%",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                  {drafting?<><Spin/>Aria is writing…</>:"📊 Generate Personalized Email"}
                </Btn>
                {draft&&(
                  <div>
                    <textarea value={draft} onChange={e=>setDraft(e.target.value)} style={{width:"100%",minHeight:160,padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,lineHeight:1.7,resize:"vertical",outline:"none",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <Btn variant="teal" style={{flex:1,fontSize:11}}>✓ Approve & Send</Btn>
                      <Btn variant="ghost" style={{flex:1,fontSize:11}}>✎ Edit</Btn>
                    </div>
                  </div>
                )}
              </Card>
            ):<Card style={{textAlign:"center",padding:"40px"}}><div style={{fontSize:12,color:C.text3}}>Select a lead to generate outreach</div></Card>}
          </div>
        </div>
      )}

      {view==="proposals"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {leads.filter(l=>l.stage==="Proposal"||l.stage==="Meeting").map(l=>(
            <Card key={l.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(124,109,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:C.purple2}}>{l.name[0]}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{l.name} · {l.company}</div>
                    <div style={{fontSize:11,color:C.text3}}>{l.title} · Score: <span style={{color:scoreColor(l.score)}}>{l.score}</span></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <Badge type={l.stage==="Proposal"?"warning":"info"}>{l.stage}</Badge>
                  <span style={{fontSize:14,fontWeight:700,color:C.gold}}>${l.value}/mo</span>
                  <Btn style={{fontSize:11,padding:"5px 12px"}}>Send Proposal</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setSelected(null)}>
          <div style={{background:C.bg2,border:`0.5px solid rgba(124,109,250,0.4)`,borderRadius:14,padding:24,maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(124,109,250,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.purple2}}>{selected.name[0]}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{selected.name}</div>
                <div style={{fontSize:12,color:C.text3}}>{selected.title} · {selected.company}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:2}}>{selected.email}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{marginLeft:"auto",background:"none",border:"none",color:C.text3,cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            {[{l:"Lead Score",v:<span style={{color:scoreColor(selected.score),fontWeight:700}}>{selected.score}/100</span>},{l:"Stage",v:<Badge type="info">{selected.stage}</Badge>},{l:"Deal Value",v:<span style={{color:C.gold}}>${selected.value}/mo</span>},{l:"Source",v:selected.source},{l:"Last Activity",v:selected.last}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text3}}>{r.l}</span>
                <span style={{fontSize:12}}>{r.v}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <Btn onClick={()=>{draftEmail(selected);setView("outreach");setSelected(null);}} style={{flex:1,fontSize:12}}>Draft Email</Btn>
              <Btn variant="ghost" onClick={()=>setSelected(null)} style={{flex:1,fontSize:12}}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MARKETING HUB ────────────────────────────────────
const MKT_SYS=`You are Lexi, AI Marketing Manager for AI BOS. Bold, direct, outcome-focused. No fluff. Produce the exact requested deliverable.`;

function MarketingHub(){
  const [view,setView]=useState("campaigns");
  const [contentType,setContentType]=useState("LinkedIn Post");
  const [topic,setTopic]=useState("");
  const [generating,setGenerating]=useState(false);
  const [content,setContent]=useState("");
  const [campaigns]=useState([
    {id:1,name:"Q3 MRR Push",status:"Active",channel:"Email",sent:1240,opens:"34%",clicks:"8.2%",revenue:"$12,400",agent:"lexi"},
    {id:2,name:"Company Brain Feature Launch",status:"Active",channel:"LinkedIn",sent:0,opens:"—",clicks:"—",revenue:"—",agent:"lexi"},
    {id:3,name:"Churn Recovery Sequence",status:"Paused",channel:"Email",sent:89,opens:"41%",clicks:"12%",revenue:"$3,200",agent:"lexi"},
    {id:4,name:"Cold Outbound — Series A Startups",status:"Active",channel:"Email",sent:342,opens:"28%",clicks:"6%",revenue:"$9,800",agent:"aria"},
  ]);

  const generate=async()=>{
    if(!topic.trim())return;
    setGenerating(true);setContent("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,system:MKT_SYS,messages:[{role:"user",content:`Create a ${contentType} about: ${topic}. For AI BOS — AI Business Operating System. Tone: confident, direct, outcome-focused. No fluff.`}]})});
      const data=await res.json();
      setContent(data.content?.find(b=>b.type==="text")?.text||"");
    }catch(e){setContent("Error. Try again.");}
    setGenerating(false);
  };

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>📣 Marketing Hub</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Lexi runs your campaigns, content, and email sequences</div></div>
        <div style={{display:"flex",gap:8}}>
          {["campaigns","content","email","social","seo"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 12px",borderRadius:8,border:`0.5px solid ${view===v?C.coral:C.border}`,background:view===v?"rgba(240,106,64,0.12)":"transparent",color:view===v?C.coral:C.text3,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Emails Sent",v:"1,671",c:C.purple2},{l:"Avg Open Rate",v:"34%",c:C.teal},{l:"Pipeline Generated",v:"$25.4K",c:C.gold},{l:"Active Campaigns",v:campaigns.filter(c=>c.status==="Active").length,c:C.coral}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>

      {view==="campaigns"&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:600}}>Active Campaigns</span>
            <Btn style={{fontSize:11,padding:"5px 12px"}}>+ New Campaign</Btn>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Campaign","Agent","Status","Channel","Sent","Opens","Clicks","Revenue"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:C.text3,padding:"6px 8px",borderBottom:`0.5px solid ${C.border}`,letterSpacing:.5}}>{h}</th>)}</tr></thead>
            <tbody>
              {campaigns.map(c=>(
                <tr key={c.id} style={{borderBottom:`0.5px solid ${C.border}`}}>
                  <td style={{padding:"10px 8px",fontSize:13,fontWeight:600}}>{c.name}</td>
                  <td style={{padding:"10px 8px"}}><span style={{fontSize:11,color:c.agent==="lexi"?C.coral:C.purple2}}>📣 {c.agent}</span></td>
                  <td style={{padding:"10px 8px"}}><Badge type={c.status==="Active"?"success":"default"}>{c.status}</Badge></td>
                  <td style={{padding:"10px 8px",fontSize:12,color:C.text2}}>{c.channel}</td>
                  <td style={{padding:"10px 8px",fontSize:12}}>{c.sent}</td>
                  <td style={{padding:"10px 8px",fontSize:12,color:C.teal}}>{c.opens}</td>
                  <td style={{padding:"10px 8px",fontSize:12,color:C.purple2}}>{c.clicks}</td>
                  <td style={{padding:"10px 8px",fontSize:12,color:C.gold,fontWeight:600}}>{c.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(view==="content"||view==="social"||view==="email")&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:C.coral}}>📣 Content Generator</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:C.text3,marginBottom:6}}>Content Type</div>
              <select value={contentType} onChange={e=>setContentType(e.target.value)} style={{width:"100%",padding:"8px 10px",background:C.bg3,border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,outline:"none"}}>
                {["LinkedIn Post","Twitter Thread","Email Subject Lines","Newsletter Section","Blog Intro","Ad Copy","Cold Email"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:C.text3,marginBottom:6}}>Topic or Goal</div>
              <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Why AI employees are better than hiring…" style={{width:"100%",minHeight:80,padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,outline:"none",lineHeight:1.6,resize:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["Company Brain launch","Why replace your SDR","ROI of AI workforce","3 signals to fire your agency"].map(t=>(
                <button key={t} onClick={()=>setTopic(t)} style={{padding:"3px 8px",background:"rgba(240,106,64,0.08)",border:`0.5px solid rgba(240,106,64,0.2)`,borderRadius:20,fontSize:10,color:C.coral,cursor:"pointer"}}>{t}</button>
              ))}
            </div>
            <Btn onClick={generate} disabled={generating||!topic.trim()} variant="danger" style={{width:"100%",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
              {generating?<><Spin color={C.coral}/>Lexi is writing…</>:"📣 Generate Content"}
            </Btn>
          </Card>
          <Card>
            {content?(
              <div>
                <div style={{fontSize:11,color:C.coral,fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Lexi's Output · {contentType}</div>
                <textarea value={content} onChange={e=>setContent(e.target.value)} style={{width:"100%",minHeight:200,padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,lineHeight:1.7,resize:"vertical",outline:"none",fontFamily:"inherit"}}/>
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <Btn variant="teal" style={{flex:1,fontSize:11}}>✓ Publish</Btn>
                  <Btn variant="ghost" style={{flex:1,fontSize:11}}>Schedule</Btn>
                  <Btn variant="ghost" style={{fontSize:11}}>Copy</Btn>
                </div>
              </div>
            ):<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",minHeight:200,color:C.text3,fontSize:12}}>Content will appear here</div>}
          </Card>
        </div>
      )}

      {view==="seo"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Top Ranking Keywords</div>
            {[{kw:"AI business operating system",pos:3,vol:"1.2K",trend:"↑"},{kw:"AI employees for startups",pos:7,vol:"890",trend:"↑"},{kw:"replace SaaS tools with AI",pos:12,vol:"2.1K",trend:"→"},{kw:"AI workforce platform",pos:4,vol:"540",trend:"↑"},{kw:"company brain AI",pos:1,vol:"320",trend:"↑"}].map((k,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{k.kw}</div>
                  <div style={{fontSize:10,color:C.text3}}>Vol: {k.vol}/mo</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:11,color:k.trend==="↑"?C.teal:C.text3}}>{k.trend}</span>
                  <span style={{fontSize:13,fontWeight:700,color:k.pos<=5?C.teal:k.pos<=10?C.gold:C.text2}}>#{k.pos}</span>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>SEO Recommendations from Lexi</div>
            {["Add FAQ schema to pricing page — 3 featured snippets available","Update meta for 'AI employees' — competitor outranks by 0.3 score","Publish case study: Nexus AI 10x meetings — targets 3 keywords","Internal link 'Company Brain' from product docs to landing page","Create comparison page: AI BOS vs HubSpot — 4,200 monthly searches"].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"flex-start"}}>
                <span style={{color:C.teal,fontWeight:700,flexShrink:0}}>→</span>
                <span style={{fontSize:12,color:C.text2,lineHeight:1.5}}>{r}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── SUPPORT HUB ───────────────────────────────────────
const TICKETS=[
  {id:"T-001",customer:"Nexus AI",email:"sarah@nexusai.co",subject:"AI agents stopped sending emails after Slack integration",status:"Open",priority:"High",created:"2h ago",ai:true},
  {id:"T-002",customer:"FlowStack",email:"m.reid@flowstack.com",subject:"How do I add custom brand voice to Company Brain?",status:"In Progress",priority:"Medium",created:"4h ago",ai:true},
  {id:"T-003",customer:"Orbis Labs",email:"priya@orbis.io",subject:"Billing question — upgrading from Growth to Team",status:"Open",priority:"Low",created:"6h ago",ai:false},
  {id:"T-004",customer:"Clearpath",email:"alex@clearpath.ai",subject:"Aria booked a meeting at wrong time — calendar sync issue",status:"Escalated",priority:"High",created:"1d ago",ai:false},
  {id:"T-005",customer:"TechFlow",email:"jordan@techflow.io",subject:"Feature request: export activity log to CSV",status:"Resolved",priority:"Low",created:"2d ago",ai:true},
];
const SUPPORT_SYS=`You are Marcus, AI Customer Support specialist for AI BOS. Empathetic, solution-focused, proactive about churn. Write a professional support response that: 1) acknowledges the issue empathetically, 2) provides clear step-by-step resolution, 3) ends with confidence-restoring statement. AI BOS is an AI Business Operating System.`;

function SupportHub(){
  const [view,setView]=useState("tickets");
  const [tickets,setTickets]=useState(TICKETS);
  const [selected,setSelected]=useState(null);
  const [reply,setReply]=useState("");
  const [drafting,setDrafting]=useState(false);
  const [chat,setChat]=useState([{role:"assistant",text:"Hi! I'm Marcus, your AI Support agent. I'm here 24/7. What can I help you with today?"}]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);

  const draftReply=async(ticket)=>{
    setDrafting(true);setReply("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:500,system:SUPPORT_SYS,messages:[{role:"user",content:`Ticket from ${ticket.customer}: "${ticket.subject}". Priority: ${ticket.priority}.`}]})});
      const data=await res.json();
      setReply(data.content?.find(b=>b.type==="text")?.text||"");
    }catch(e){setReply("Error. Try again.");}
    setDrafting(false);
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const msg=chatInput;setChatInput("");
    setChat(p=>[...p,{role:"user",text:msg}]);
    setChatLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,system:SUPPORT_SYS,messages:[...chat.map(m=>({role:m.role==="user"?"user":"assistant",content:m.text})),{role:"user",content:msg}]})});
      const data=await res.json();
      setChat(p=>[...p,{role:"assistant",text:data.content?.find(b=>b.type==="text")?.text||""}]);
    }catch(e){setChat(p=>[...p,{role:"assistant",text:"Sorry, I had trouble connecting. Try again."}]);}
    setChatLoading(false);
  };

  const statusColor=s=>({Open:C.gold,"In Progress":C.purple2,Escalated:C.coral,Resolved:C.teal}[s]||C.text3);
  const priorityColor=p=>({High:C.coral,Medium:C.gold,Low:C.teal}[p]||C.text3);

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>🎧 Support Hub</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Marcus handles tickets, chat, and churn prevention</div></div>
        <div style={{display:"flex",gap:8}}>
          {["tickets","livechat","kb"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 12px",borderRadius:8,border:`0.5px solid ${view===v?C.teal:C.border}`,background:view===v?"rgba(34,211,176,0.12)":"transparent",color:view===v?C.teal:C.text3,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{v==="kb"?"Knowledge Base":v==="livechat"?"Live Chat":v}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Open Tickets",v:tickets.filter(t=>t.status==="Open").length,c:C.gold},{l:"Auto-Resolved",v:"29",c:C.teal},{l:"Escalated",v:tickets.filter(t=>t.status==="Escalated").length,c:C.coral},{l:"Avg Response",v:"< 2 min",c:C.purple2}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>

      {view==="tickets"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:14}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:600}}>Support Tickets</span>
              <div style={{display:"flex",gap:6}}>
                {["All","Open","Escalated"].map(f=><button key={f} style={{padding:"4px 10px",borderRadius:20,border:`0.5px solid ${C.border}`,background:"transparent",color:C.text3,fontSize:11,cursor:"pointer"}}>{f}</button>)}
              </div>
            </div>
            {tickets.map(t=>(
              <div key={t.id} onClick={()=>{setSelected(t);draftReply(t);}} style={{display:"flex",gap:12,padding:"12px",background:selected?.id===t.id?"rgba(34,211,176,0.06)":"transparent",border:`0.5px solid ${selected?.id===t.id?C.teal:C.border}`,borderRadius:8,marginBottom:6,cursor:"pointer"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600}}>{t.customer}</span>
                    <div style={{display:"flex",gap:6}}>
                      <span style={{fontSize:10,color:priorityColor(t.priority)}}>{t.priority}</span>
                      <span style={{fontSize:10,color:statusColor(t.status),fontWeight:600}}>{t.status}</span>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:C.text2,marginBottom:4}}>{t.subject}</div>
                  <div style={{display:"flex",gap:10}}>
                    <span style={{fontSize:10,color:C.text3}}>{t.id} · {t.created}</span>
                    {t.ai&&<span style={{fontSize:10,color:C.teal}}>🎧 AI can resolve</span>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <div>
            {selected?(
              <Card>
                <div style={{fontSize:12,fontWeight:700,color:C.teal,marginBottom:10}}>🎧 Marcus's Reply Draft</div>
                <div style={{fontSize:11,color:C.text3,marginBottom:8}}>{selected.id} · {selected.customer} · {selected.subject.slice(0,40)}…</div>
                {drafting?<div style={{display:"flex",alignItems:"center",gap:8,color:C.text3,fontSize:12,padding:"20px 0"}}><Spin size={12} color={C.teal}/>Marcus is drafting…</div>:(
                  <div>
                    <textarea value={reply} onChange={e=>setReply(e.target.value)} style={{width:"100%",minHeight:200,padding:"10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,lineHeight:1.7,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <Btn variant="teal" style={{flex:1,fontSize:11}}>✓ Send Reply</Btn>
                      <Btn variant="danger" style={{flex:1,fontSize:11}}>↑ Escalate</Btn>
                    </div>
                    <button onClick={()=>draftReply(selected)} style={{marginTop:8,width:"100%",padding:"6px",background:"transparent",border:`0.5px solid ${C.border}`,borderRadius:6,color:C.text3,fontSize:11,cursor:"pointer"}}>↺ Regenerate</button>
                  </div>
                )}
              </Card>
            ):<Card style={{textAlign:"center",padding:"40px"}}><div style={{fontSize:12,color:C.text3}}>Select a ticket to draft an AI reply</div></Card>}
          </div>
        </div>
      )}

      {view==="livechat"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card style={{display:"flex",flexDirection:"column",height:400}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:C.teal}}>🎧 Live Chat with Marcus</div>
            <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {chat.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:8,background:m.role==="user"?"rgba(124,109,250,0.15)":"rgba(34,211,176,0.1)",border:`0.5px solid ${m.role==="user"?"rgba(124,109,250,0.3)":"rgba(34,211,176,0.25)"}`,fontSize:12,color:C.text,lineHeight:1.6}}>{m.text}</div>
                </div>
              ))}
              {chatLoading&&<div style={{display:"flex",alignItems:"center",gap:6,color:C.text3,fontSize:11}}><Spin size={10} color={C.teal}/>Marcus is typing…</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Type your question…" style={{flex:1,padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,outline:"none"}}/>
              <Btn variant="teal" onClick={sendChat} disabled={chatLoading} style={{padding:"8px 14px"}}>Send</Btn>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Quick Stats</div>
            {[{l:"Churn risks flagged",v:3,c:C.coral},{l:"Tickets resolved today",v:29,c:C.teal},{l:"Avg CSAT score",v:"4.8/5",c:C.gold},{l:"KB articles created",v:14,c:C.purple2}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text2}}>{s.l}</span>
                <span style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==="kb"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Knowledge Base Articles</div>
            {[{t:"How to set up Company Brain",v:142,cat:"Setup"},{t:"Configuring agent autonomy levels",v:98,cat:"Agents"},{t:"Gmail integration troubleshooting",v:234,cat:"Integrations"},{t:"Pricing and plan comparison",v:189,cat:"Billing"},{t:"How Aria scores leads",v:67,cat:"Sales"},{t:"CRM sync — HubSpot & Salesforce",v:123,cat:"Integrations"}].map((a,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{a.t}</div>
                  <div style={{fontSize:10,color:C.text3,marginTop:2}}>{a.cat} · {a.v} views</div>
                </div>
                <Pill color={C.teal} bg="rgba(34,211,176,0.1)">{a.cat}</Pill>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12,color:C.teal}}>🎧 Marcus Auto-Created</div>
            <div style={{fontSize:12,color:C.text2,marginBottom:12,lineHeight:1.6}}>Marcus automatically creates KB articles from resolved tickets. Last 7 days:</div>
            {[{t:"Fix: Agent emails stop after CRM reconnect",from:"T-001"},{t:"How to customize brand voice step-by-step",from:"T-002"},{t:"Calendar sync — common timezone issues",from:"T-004"}].map((a,i)=>(
              <div key={i} style={{background:"rgba(34,211,176,0.06)",border:`0.5px solid rgba(34,211,176,0.2)`,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{a.t}</div>
                <div style={{fontSize:10,color:C.text3}}>Auto-created from {a.from}</div>
              </div>
            ))}
            <Btn variant="ghost" style={{width:"100%",fontSize:11,marginTop:4}}>View all auto-created articles</Btn>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── FINANCE HUB ───────────────────────────────────────
const FIN_SYS=`You are Felix, AI Finance Analyst for AI BOS. Numbers-first. Structure: Summary → Key Signals → Risks → Recommendation. Be specific with figures.`;

function FinanceHub(){
  const [view,setView]=useState("overview");
  const [analyzing,setAnalyzing]=useState(false);
  const [analysis,setAnalysis]=useState("");
  const [question,setQuestion]=useState("");

  const analyze=async(q)=>{
    const qry=q||question;if(!qry.trim())return;
    setAnalyzing(true);setAnalysis("");
    try{
      const ctx=`Current financials: MRR $47,200 | New MRR $8,100 | Expansion $3,200 | Churned $2,400 | Net New MRR $8,900 | API costs up 18% | CAC $420 | LTV $6,800 | LTV:CAC ratio 16.2x | Runway: 18 months`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,system:FIN_SYS,messages:[{role:"user",content:`${ctx}\n\nQuestion: ${qry}`}]})});
      const data=await res.json();
      setAnalysis(data.content?.find(b=>b.type==="text")?.text||"");
    }catch(e){setAnalysis("Error. Try again.");}
    setAnalyzing(false);
  };

  const MRR=[18,22,27,31,38,47];
  const maxMRR=Math.max(...MRR);
  const w=280,h=60,pad=8;
  const mrrPts=MRR.map((v,i)=>{const x=pad+(i/(MRR.length-1))*(w-pad*2);const y=h-pad-((v/maxMRR)*(h-pad*2));return`${x},${y}`;}).join(" ");

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>💰 Finance Hub</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Felix tracks revenue, costs, forecasts, and flags risks</div></div>
        <div style={{display:"flex",gap:8}}>
          {["overview","revenue","invoices","forecasting"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 12px",borderRadius:8,border:`0.5px solid ${view===v?C.gold:C.border}`,background:view===v?"rgba(250,204,75,0.12)":"transparent",color:view===v?C.gold:C.text3,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"MRR",v:"$47,200",sub:"↑ $8,900 net new",c:C.teal},{l:"ARR",v:"$566K",sub:"Annualized",c:C.purple2},{l:"LTV:CAC",v:"16.2x",sub:"CAC $420 · LTV $6.8K",c:C.gold},{l:"Runway",v:"18 mo",sub:"At current burn",c:C.green}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:10,color:C.text3,marginTop:3}}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {view==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>MRR Growth</div>
            <svg width={w} height={h} style={{display:"block",marginBottom:8}}>
              <polyline points={mrrPts} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round"/>
              {MRR.map((v,i)=>{const x=pad+(i/(MRR.length-1))*(w-pad*2);const y=h-pad-((v/maxMRR)*(h-pad*2));return i===MRR.length-1?<circle key={i} cx={x} cy={y} r={4} fill={C.teal}/>:<circle key={i} cx={x} cy={y} r={2} fill={C.purple}/>;})}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              {["Jan","Feb","Mar","Apr","May","Jun"].map(m=><span key={m} style={{fontSize:9,color:C.text3}}>{m}</span>)}
            </div>
            <div style={{marginTop:12}}>
              {[{l:"New MRR",v:"$8,100",c:C.teal},{l:"Expansion",v:"$3,200",c:C.purple2},{l:"Churned",v:"-$2,400",c:C.coral},{l:"Net New MRR",v:"$8,900",c:C.gold}].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.text2}}>{r.l}</span>
                  <span style={{fontSize:13,fontWeight:700,color:r.c}}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>
          <div>
            <Card style={{marginBottom:14,background:"rgba(240,106,64,0.04)",border:`0.5px solid rgba(240,106,64,0.25)`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.coral,marginBottom:8}}>⚠ Felix's Risk Flags</div>
              {["API costs up 18% MoM — $1,240 over budget","3 churned customers this month — $2,400 MRR lost","Churn rate 3.2% — above 2.5% target","Felix recommends reviewing pricing strategy"].map((r,i)=>(
                <div key={i} style={{fontSize:11,color:C.text2,marginBottom:6,display:"flex",gap:6}}><span style={{color:C.coral,flexShrink:0}}>!</span>{r}</div>
              ))}
            </Card>
            <Card>
              <div style={{fontSize:12,fontWeight:600,color:C.gold,marginBottom:8}}>💰 Ask Felix</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {["What's our burn rate?","Will we hit $100K MRR?","How's our unit economics?","What's driving churn?"].map(q=>(
                  <button key={q} onClick={()=>analyze(q)} style={{padding:"4px 8px",background:"rgba(250,204,75,0.08)",border:`0.5px solid rgba(250,204,75,0.2)`,borderRadius:20,fontSize:10,color:C.gold,cursor:"pointer"}}>{q}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()} placeholder="Ask Felix anything…" style={{flex:1,padding:"7px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,outline:"none"}}/>
                <Btn onClick={()=>analyze()} disabled={analyzing} style={{background:C.gold,color:"#000",padding:"7px 12px"}}>{analyzing?<Spin size={11} color="#000"/>:"→"}</Btn>
              </div>
              {analysis&&<div style={{background:"rgba(250,204,75,0.06)",border:`0.5px solid rgba(250,204,75,0.2)`,borderRadius:8,padding:"10px 12px",fontSize:11,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:180,overflowY:"auto"}}>{analysis}</div>}
            </Card>
          </div>
        </div>
      )}

      {view==="revenue"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Revenue by Plan</div>
            {[{plan:"Team ($1,999/mo)",customers:12,mrr:"$23,988",pct:51},{plan:"Growth ($799/mo)",customers:24,mrr:"$19,176",pct:41},{plan:"Starter ($299/mo)",customers:14,mrr:"$4,186",pct:9}].map(p=>(
              <div key={p.plan} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:500}}>{p.plan}</span>
                  <span style={{fontSize:12,color:C.gold,fontWeight:600}}>{p.mrr}</span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:4}}>
                  <div style={{height:"100%",width:`${p.pct}%`,background:C.grad,borderRadius:4}}/>
                </div>
                <div style={{fontSize:10,color:C.text3,marginTop:2}}>{p.customers} customers · {p.pct}% of MRR</div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Top Revenue Customers</div>
            {[{name:"TechFlow",plan:"Team",mrr:1999,health:"Healthy"},{name:"Nexus AI",plan:"Team",mrr:1999,health:"At Risk"},{name:"Orbis Labs",plan:"Team",mrr:1999,health:"Healthy"},{name:"FlowStack",plan:"Growth",mrr:799,health:"Healthy"},{name:"Vantage",plan:"Growth",mrr:799,health:"Healthy"}].map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <div><div style={{fontSize:12,fontWeight:600}}>{c.name}</div><div style={{fontSize:10,color:C.text3}}>{c.plan}</div></div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <Badge type={c.health==="Healthy"?"success":"danger"}>{c.health}</Badge>
                  <span style={{fontSize:13,fontWeight:700,color:C.gold}}>${c.mrr}/mo</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==="invoices"&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:600}}>Invoices</span>
            <Btn style={{fontSize:11,padding:"5px 12px"}}>+ Create Invoice</Btn>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Invoice","Customer","Amount","Status","Due","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:10,color:C.text3,padding:"6px 10px",borderBottom:`0.5px solid ${C.border}`,letterSpacing:.5}}>{h}</th>)}</tr></thead>
            <tbody>
              {[{id:"INV-2026-089",c:"TechFlow",a:"$1,999",s:"Paid",d:"Jun 1"},{id:"INV-2026-088",c:"Nexus AI",a:"$1,999",s:"Paid",d:"Jun 1"},{id:"INV-2026-087",c:"FlowStack",a:"$799",s:"Overdue",d:"May 15"},{id:"INV-2026-086",c:"Orbis Labs",a:"$1,999",s:"Pending",d:"Jun 15"},{id:"INV-2026-085",c:"Clearpath",a:"$299",s:"Paid",d:"Jun 1"}].map((inv,i)=>(
                <tr key={i} style={{borderBottom:`0.5px solid ${C.border}`}}>
                  <td style={{padding:"10px",fontSize:12,color:C.purple2}}>{inv.id}</td>
                  <td style={{padding:"10px",fontSize:12}}>{inv.c}</td>
                  <td style={{padding:"10px",fontSize:13,fontWeight:700,color:C.gold}}>{inv.a}</td>
                  <td style={{padding:"10px"}}><Badge type={inv.s==="Paid"?"success":inv.s==="Overdue"?"danger":"warning"}>{inv.s}</Badge></td>
                  <td style={{padding:"10px",fontSize:11,color:C.text3}}>{inv.d}</td>
                  <td style={{padding:"10px"}}><button style={{fontSize:11,padding:"3px 8px",background:"transparent",border:`0.5px solid ${C.border}`,borderRadius:6,color:C.text3,cursor:"pointer"}}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view==="forecasting"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>MRR Forecast — 6 Months</div>
            {[{m:"Jul 2026",v:"$54K",growth:"+15%"},{m:"Aug 2026",v:"$62K",growth:"+15%"},{m:"Sep 2026",v:"$71K",growth:"+14%"},{m:"Oct 2026",v:"$82K",growth:"+15%"},{m:"Nov 2026",v:"$94K",growth:"+15%"},{m:"Dec 2026",v:"$108K",growth:"+15%"}].map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <span style={{fontSize:12,color:C.text2}}>{f.m}</span>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:10,color:C.teal}}>{f.growth}</span>
                  <span style={{fontSize:13,fontWeight:700,color:C.gold}}>{f.v}</span>
                </div>
              </div>
            ))}
            <div style={{marginTop:10,padding:"10px",background:"rgba(34,211,176,0.06)",borderRadius:8,fontSize:11,color:C.teal,textAlign:"center"}}>Projected ARR by Dec 2026: <strong>$1.3M</strong></div>
          </Card>
          <Card>
            <div style={{fontSize:12,fontWeight:600,color:C.gold,marginBottom:8}}>💰 Felix's Forecast Analysis</div>
            <Btn onClick={()=>analyze("What's our revenue forecast for the next 6 months? What are the key assumptions and risks?")} disabled={analyzing} style={{width:"100%",background:C.gold,color:"#000",fontSize:12,marginBottom:12,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
              {analyzing?<><Spin size={11} color="#000"/>Analyzing…</>:"Run Forecast Analysis →"}
            </Btn>
            {analysis&&<div style={{background:"rgba(250,204,75,0.06)",border:`0.5px solid rgba(250,204,75,0.2)`,borderRadius:8,padding:"10px 12px",fontSize:11,color:C.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{analysis}</div>}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── OPERATIONS HUB ────────────────────────────────────
function OperationsHub(){
  const [view,setView]=useState("tasks");
  const [tasks,setTasks]=useState([
    {id:1,title:"Onboard TechFlow — new Team plan customer",agent:"nova",priority:"High",status:"In Progress",due:"Today",dept:"Ops"},
    {id:2,title:"Review and approve 3 agent outreach sequences",agent:"nova",priority:"High",status:"Pending",due:"Today",dept:"Sales"},
    {id:3,title:"Update Company Brain with new product docs",agent:"nova",priority:"Medium",status:"Done",due:"Yesterday",dept:"Brain"},
    {id:4,title:"Coordinate deal handoff — Nexus AI → onboarding",agent:"nova",priority:"Critical",status:"Done",due:"Jun 13",dept:"Ops"},
    {id:5,title:"Set up weekly marketing report automation",agent:"nova",priority:"Medium",status:"In Progress",due:"Jun 16",dept:"Marketing"},
    {id:6,title:"Review API cost spike — coordinate with Felix",agent:"nova",priority:"High",status:"Pending",due:"Today",dept:"Finance"},
  ]);

  const [workflows]=useState([
    {name:"New Customer Onboarding",triggers:"Deal Closed",steps:["CRM Update (Aria)","Welcome Email (Lexi)","Onboarding Ticket (Marcus)","Setup Call Booked (Nova)"],status:"Active",runs:12},
    {name:"Churn Risk Response",triggers:"Churn Flag",steps:["Risk Assessment (Felix)","Retention Email (Lexi)","Personal Outreach (Aria)","Executive Alert (Nova)"],status:"Active",runs:4},
    {name:"Lead Qualification",triggers:"New Lead",steps:["Score Lead (Aria)","Enrich Data (Aria)","ICP Check (Nova)","Assign Sequence (Aria)"],status:"Active",runs:89},
    {name:"Weekly Reporting",triggers:"Every Monday 9AM",steps:["Revenue Report (Felix)","Marketing Summary (Lexi)","Sales Pipeline (Aria)","Ops Review (Nova)"],status:"Active",runs:8},
  ]);

  const statusColor=s=>({Done:C.teal,"In Progress":C.purple2,Pending:C.text3,Blocked:C.coral}[s]||C.text3);
  const prioColor=p=>({Critical:C.coral,High:C.gold,Medium:C.purple2,Low:C.text3}[p]||C.text3);

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>⚙️ Operations Hub</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>Nova coordinates tasks, workflows, and cross-agent handoffs</div></div>
        <div style={{display:"flex",gap:8}}>
          {["tasks","workflows","automation"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 12px",borderRadius:8,border:`0.5px solid ${view===v?"#63c8c8":C.border}`,background:view===v?"rgba(99,200,200,0.12)":"transparent",color:view===v?"#63c8c8":C.text3,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Tasks Today",v:tasks.filter(t=>t.due==="Today").length,c:"#63c8c8"},{l:"In Progress",v:tasks.filter(t=>t.status==="In Progress").length,c:C.purple2},{l:"Active Workflows",v:workflows.filter(w=>w.status==="Active").length,c:C.teal},{l:"Workflow Runs",v:"113",c:C.gold}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>

      {view==="tasks"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:600}}>Task Board</span>
              <Btn style={{fontSize:11,padding:"5px 12px"}}>+ Add Task</Btn>
            </div>
            {tasks.map(t=>(
              <div key={t.id} style={{display:"flex",gap:10,padding:"10px",background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:8,marginBottom:6,alignItems:"flex-start"}}>
                <input type="checkbox" checked={t.status==="Done"} onChange={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,status:x.status==="Done"?"Pending":"Done"}:x))} style={{marginTop:2,cursor:"pointer"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:t.status==="Done"?C.text3:C.text,textDecoration:t.status==="Done"?"line-through":"none"}}>{t.title}</div>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <span style={{fontSize:10,color:prioColor(t.priority)}}>{t.priority}</span>
                    <span style={{fontSize:10,color:C.text3}}>Due: {t.due}</span>
                    <span style={{fontSize:10,color:C.text3}}>{t.dept}</span>
                  </div>
                </div>
                <Badge type={t.status==="Done"?"success":t.status==="In Progress"?"info":"default"}>{t.status}</Badge>
              </div>
            ))}
          </Card>
          <div>
            <Card style={{marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:"#63c8c8"}}>⚙️ Nova's Focus Today</div>
              {["Coordinate onboarding for 2 new Team customers","Review 6 pending cross-agent handoffs","Flag API cost spike to Felix + schedule review","Ensure Aria's outreach sequences are optimized"].map((a,i)=>(
                <div key={i} style={{fontSize:11,color:C.text2,marginBottom:6,display:"flex",gap:6}}><span style={{color:"#63c8c8",flexShrink:0}}>→</span>{a}</div>
              ))}
            </Card>
            <Card>
              <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Agent Workload</div>
              {AGENTS.map(a=>{
                const count={aria:47,marcus:43,lexi:12,felix:8,nova:23}[a.id];
                return(
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{fontSize:13}}>{a.emoji}</span>
                    <span style={{fontSize:11,color:a.color,width:50}}>{a.name}</span>
                    <div style={{flex:1,height:4,background:"rgba(255,255,255,0.07)",borderRadius:4}}>
                      <div style={{height:"100%",width:`${(count/50)*100}%`,background:a.color,borderRadius:4,opacity:.8}}/>
                    </div>
                    <span style={{fontSize:10,color:C.text3,width:20,textAlign:"right"}}>{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      )}

      {view==="workflows"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {workflows.map((w,i)=>(
            <Card key={i} style={{border:`0.5px solid rgba(99,200,200,0.25)`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{w.name}</div>
                  <div style={{fontSize:11,color:C.text3}}>Trigger: <span style={{color:C.gold}}>{w.triggers}</span> · {w.runs} runs</div>
                </div>
                <Badge type="success">{w.status}</Badge>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {w.steps.map((s,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{background:"rgba(99,200,200,0.1)",border:`0.5px solid rgba(99,200,200,0.3)`,borderRadius:6,padding:"4px 10px",fontSize:11,color:"#63c8c8"}}>{s}</div>
                    {j<w.steps.length-1&&<span style={{color:C.text3,fontSize:12}}>→</span>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
          <div style={{textAlign:"center",padding:"20px"}}>
            <Btn style={{background:C.grad,border:"none"}}>+ Build New Workflow</Btn>
          </div>
        </div>
      )}

      {view==="automation"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Automation Rules</div>
            {[{trigger:"New lead score > 85",action:"Aria starts personalized outreach",active:true},{trigger:"Ticket unresolved > 4 hours",action:"Marcus escalates to human + notifies Nova",active:true},{trigger:"Customer MRR > $1,999",action:"Felix generates quarterly ROI report",active:false},{trigger:"Churn risk flagged",action:"Lexi sends retention campaign + Aria follows up",active:true},{trigger:"Deal closed",action:"Nova triggers onboarding workflow",active:true}].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"flex-start"}}>
                <div style={{width:24,height:14,borderRadius:7,background:r.active?"rgba(34,211,176,0.3)":"rgba(255,255,255,0.1)",position:"relative",flexShrink:0,marginTop:2,cursor:"pointer"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:r.active?C.teal:"#555",position:"absolute",top:2,left:r.active?12:2,transition:".2s"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.text3,marginBottom:2}}>IF: {r.trigger}</div>
                  <div style={{fontSize:12,color:C.text2}}>THEN: {r.action}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Automation Metrics</div>
            {[{l:"Actions automated this week",v:"847",c:C.teal},{l:"Human hours saved",v:"~34 hrs",c:C.purple2},{l:"Avg automation success rate",v:"94%",c:C.gold},{l:"Rules active",v:"4/5",c:"#63c8c8"}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text2}}>{s.l}</span>
                <span style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────
function Notifications(){
  const [notifs,setNotifs]=useState([
    {id:1,type:"approval",title:"Aria wants to send cold email to Stripe CEO",desc:"Confidence: 62% — below threshold",time:"2 min ago",read:false,agent:"aria"},
    {id:2,type:"alert",title:"API cost spike detected",desc:"Felix flagged 18% increase — $1,240 over budget this month",time:"1 hr ago",read:false,agent:"felix"},
    {id:3,type:"success",title:"Deal closed — Nexus AI Team plan",desc:"$1,999/mo · Nova triggered onboarding workflow",time:"3 hr ago",read:false,agent:"nova"},
    {id:4,type:"approval",title:"Lexi wants to launch $4,500 LinkedIn campaign",desc:"Confidence: 71% — review required",time:"4 hr ago",read:false,agent:"lexi"},
    {id:5,type:"warning",title:"Churn risk: TechCorp customer",desc:"Marcus flagged 3 negative signals this week",time:"5 hr ago",read:true,agent:"marcus"},
    {id:6,type:"success",title:"14 meetings booked today",desc:"Aria's weekly record — 62% above target",time:"6 hr ago",read:true,agent:"aria"},
    {id:7,type:"info",title:"Company Brain updated",desc:"34 new chunks indexed from product docs upload",time:"1d ago",read:true,agent:null},
  ]);

  const typeIcon={approval:"⏳",alert:"🚨",success:"✅",warning:"⚠️",info:"ℹ️"};
  const typeBg={approval:"rgba(250,204,75,0.1)",alert:"rgba(240,106,64,0.1)",success:"rgba(74,222,128,0.1)",warning:"rgba(250,204,75,0.1)",info:"rgba(124,109,250,0.1)"};
  const typeColor={approval:C.gold,alert:C.coral,success:C.green,warning:C.gold,info:C.purple2};

  const markRead=id=>setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
  const dismiss=id=>setNotifs(p=>p.filter(n=>n.id!==id));
  const unread=notifs.filter(n=>!n.read).length;

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>🔔 Notifications</div>
          <div style={{fontSize:12,color:C.text3,marginTop:2}}>{unread} unread · Approvals, alerts, agent updates</div>
        </div>
        <button onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))} style={{fontSize:12,color:C.text3,background:"transparent",border:`0.5px solid ${C.border}`,borderRadius:6,padding:"6px 12px",cursor:"pointer"}}>Mark all read</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Pending Approvals",v:notifs.filter(n=>n.type==="approval"&&!n.read).length,c:C.gold},{l:"Active Alerts",v:notifs.filter(n=>n.type==="alert"&&!n.read).length,c:C.coral},{l:"Unread",v:unread,c:C.purple2},{l:"Total Today",v:notifs.length,c:C.text2}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {notifs.map(n=>{
          const agent=AGENTS.find(a=>a.id===n.agent);
          return(
            <div key={n.id} onClick={()=>markRead(n.id)} style={{background:n.read?C.bg2:`${typeBg[n.type]}`,border:`0.5px solid ${n.read?C.border:`${typeColor[n.type]}40`}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
              {!n.read&&<div style={{width:6,height:6,borderRadius:"50%",background:typeColor[n.type],flexShrink:0,marginTop:4}}/>}
              <span style={{fontSize:16,flexShrink:0}}>{typeIcon[n.type]}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:n.read?C.text2:C.text}}>{n.title}</span>
                  <span style={{fontSize:10,color:C.text3,flexShrink:0,marginLeft:10}}>{n.time}</span>
                </div>
                <div style={{fontSize:12,color:C.text3,marginBottom:n.type==="approval"?8:0}}>{n.desc}</div>
                {n.type==="approval"&&!n.read&&(
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{padding:"5px 12px",background:"rgba(34,211,176,0.15)",border:`0.5px solid rgba(34,211,176,0.3)`,borderRadius:6,color:C.teal,fontSize:11,fontWeight:600,cursor:"pointer"}}>✓ Approve</button>
                    <button onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{padding:"5px 12px",background:"rgba(240,106,64,0.1)",border:`0.5px solid rgba(240,106,64,0.25)`,borderRadius:6,color:C.coral,fontSize:11,fontWeight:600,cursor:"pointer"}}>✕ Reject</button>
                  </div>
                )}
              </div>
              {agent&&<div style={{width:28,height:28,borderRadius:"50%",background:agent.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{agent.emoji}</div>}
              <button onClick={e=>{e.stopPropagation();dismiss(n.id);}} style={{background:"none",border:"none",color:C.text3,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── INTEGRATIONS ──────────────────────────────────────
function Integrations(){
  const [connected,setConnected]=useState(["gmail","hubspot","stripe","slack"]);
  const INTS=[
    {id:"gmail",name:"Gmail",cat:"Email",emoji:"📧",desc:"Send/receive emails for agent outreach and support"},
    {id:"gcal",name:"Google Calendar",cat:"Calendar",emoji:"📅",desc:"Book meetings and manage scheduling"},
    {id:"gdrive",name:"Google Drive",cat:"Storage",emoji:"📁",desc:"Access and upload documents to Company Brain"},
    {id:"slack",name:"Slack",cat:"Communication",emoji:"💬",desc:"Agent notifications and approval requests"},
    {id:"whatsapp",name:"WhatsApp",cat:"Communication",emoji:"📱",desc:"Customer support via WhatsApp"},
    {id:"hubspot",name:"HubSpot",cat:"CRM",emoji:"🟠",desc:"Sync contacts, deals, and pipeline data"},
    {id:"salesforce",name:"Salesforce",cat:"CRM",emoji:"☁️",desc:"Enterprise CRM integration"},
    {id:"stripe",name:"Stripe",cat:"Payments",emoji:"💳",desc:"Revenue data, invoices, and subscription management"},
    {id:"shopify",name:"Shopify",cat:"E-commerce",emoji:"🛍️",desc:"Order, customer, and inventory data"},
    {id:"notion",name:"Notion",cat:"Productivity",emoji:"📓",desc:"Import pages and databases to Company Brain"},
    {id:"zapier",name:"Zapier",cat:"Automation",emoji:"⚡",desc:"Connect to 5,000+ apps via Zapier"},
    {id:"linkedin",name:"LinkedIn",cat:"Social",emoji:"🔗",desc:"Lead enrichment and social selling"},
  ];
  const toggle=id=>setConnected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const cats=[...new Set(INTS.map(i=>i.cat))];

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>🔌 Integrations Hub</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>Connect your tools so AI agents can take real actions</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Connected",v:connected.length,c:C.teal},{l:"Available",v:INTS.length,c:C.purple2},{l:"Categories",v:cats.length,c:C.gold}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </Card>
        ))}
      </div>
      {cats.map(cat=>(
        <div key={cat} style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.text3,letterSpacing:.5,textTransform:"uppercase",marginBottom:10}}>{cat}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
            {INTS.filter(i=>i.cat===cat).map(int=>{
              const isConn=connected.includes(int.id);
              return(
                <div key={int.id} style={{background:C.bg2,border:`0.5px solid ${isConn?"rgba(34,211,176,0.3)":C.border}`,borderRadius:10,padding:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:22}}>{int.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{int.name}</div>
                      <div style={{fontSize:11,color:C.text3}}>{int.cat}</div>
                    </div>
                    {isConn&&<Pill color={C.teal} bg="rgba(34,211,176,0.1)">✓</Pill>}
                  </div>
                  <div style={{fontSize:11,color:C.text3,marginBottom:10,lineHeight:1.5}}>{int.desc}</div>
                  <button onClick={()=>toggle(int.id)} style={{width:"100%",padding:"6px",background:isConn?"rgba(240,106,64,0.1)":"rgba(124,109,250,0.1)",border:`0.5px solid ${isConn?"rgba(240,106,64,0.3)":"rgba(124,109,250,0.3)"}`,borderRadius:7,color:isConn?C.coral:C.purple2,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {isConn?"Disconnect":"+ Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BILLING ───────────────────────────────────────────
function Billing(){
  const [plan,setPlan]=useState("growth");
  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>💳 Billing & Subscription</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>Manage your plan, payment, and usage</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14}}>
        <div>
          <Card style={{marginBottom:14,background:"rgba(124,109,250,0.06)",border:`0.5px solid rgba(124,109,250,0.3)`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:11,color:C.text3,marginBottom:4}}>CURRENT PLAN</div>
                <div style={{fontSize:22,fontWeight:800,color:C.purple2}}>Growth Plan</div>
                <div style={{fontSize:13,color:C.text3,marginTop:2}}>$799/month · Renews Jul 14, 2026</div>
              </div>
              <Badge type="success">Active</Badge>
            </div>
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <Btn style={{fontSize:12}}>Upgrade to Team</Btn>
              <Btn variant="ghost" style={{fontSize:12}}>Manage Plan</Btn>
            </div>
          </Card>

          <div style={{fontSize:12,color:C.text3,marginBottom:10}}>CHOOSE PLAN</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[{id:"starter",name:"Starter",price:"$299",agents:"1 AI Employee",color:C.text2},{id:"growth",name:"Growth",price:"$799",agents:"3 AI Employees",color:C.purple2},{id:"team",name:"Team",price:"$1,999",agents:"8 AI Employees",color:C.teal}].map(p=>(
              <div key={p.id} onClick={()=>setPlan(p.id)} style={{background:plan===p.id?`${p.color}12`:C.bg2,border:`0.5px solid ${plan===p.id?p.color:C.border}`,borderRadius:10,padding:"14px",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:600,color:p.color,marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:22,fontWeight:800,letterSpacing:-1,marginBottom:2}}>{p.price}</div>
                <div style={{fontSize:10,color:C.text3}}>/month</div>
                <div style={{fontSize:11,color:C.text2,marginTop:8}}>{p.agents}</div>
                {plan===p.id&&<div style={{marginTop:8,fontSize:10,color:p.color,fontWeight:600}}>✓ Current plan</div>}
              </div>
            ))}
          </div>

          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Usage This Month</div>
            {[{l:"AI Actions",v:"847",max:"Unlimited",pct:42},{l:"API Calls",v:"12,400",max:"50,000",pct:25},{l:"Company Brain Chunks",v:"257",max:"Unlimited",pct:0},{l:"Team Members",v:"3",max:"10",pct:30}].map(u=>(
              <div key={u.l} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.text2}}>{u.l}</span>
                  <span style={{fontSize:12,color:C.text}}>{u.v} <span style={{color:C.text3}}>/ {u.max}</span></span>
                </div>
                {u.pct>0&&<div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:4}}><div style={{height:"100%",width:`${u.pct}%`,background:u.pct>80?C.coral:C.grad,borderRadius:4}}/></div>}
              </div>
            ))}
          </Card>
        </div>

        <div>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Payment Method</div>
            <div style={{background:"rgba(124,109,250,0.08)",border:`0.5px solid rgba(124,109,250,0.25)`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>💳</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600}}>Visa ending in 4242</div>
                    <div style={{fontSize:10,color:C.text3}}>Expires 12/2028</div>
                  </div>
                </div>
                <Badge type="success">Default</Badge>
              </div>
            </div>
            <Btn variant="ghost" style={{width:"100%",fontSize:12}}>+ Add Payment Method</Btn>
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Invoice History</div>
            {[{d:"Jun 1, 2026",a:"$799",s:"Paid"},{d:"May 1, 2026",a:"$799",s:"Paid"},{d:"Apr 1, 2026",a:"$299",s:"Paid"}].map((inv,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <div><div style={{fontSize:12}}>{inv.d}</div><div style={{fontSize:10,color:C.text3}}>Monthly subscription</div></div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.gold}}>{inv.a}</span>
                  <Badge type="success">{inv.s}</Badge>
                  <button style={{fontSize:10,color:C.purple2,background:"transparent",border:"none",cursor:"pointer"}}>PDF</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── DEVELOPER PLATFORM ────────────────────────────────
function Developer(){
  const [copied,setCopied]=useState(false);
  const apiKey="sk-bos-live-7c6dfa...2d3b0f";
  const copy=()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);};

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>🛠️ Developer Platform</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>API access, webhooks, and SDK documentation</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>API Keys</div>
            <div style={{background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,fontFamily:"monospace",color:C.text2}}>{apiKey}</span>
              <button onClick={copy} style={{fontSize:11,color:copy?C.teal:C.purple2,background:"transparent",border:"none",cursor:"pointer"}}>{copied?"✓ Copied":"Copy"}</button>
            </div>
            <Btn style={{fontSize:12,width:"100%"}}>+ Generate New Key</Btn>
          </Card>

          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Webhooks</div>
            {[{event:"agent.action.executed",url:"https://yourapp.com/webhooks/aibos",active:true},{event:"deal.closed",url:"https://yourapp.com/webhooks/deals",active:true},{event:"ticket.escalated",url:"https://yourapp.com/webhooks/support",active:false}].map((w,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"flex-start"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:w.active?C.teal:C.text3,flexShrink:0,marginTop:4}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.purple2,fontFamily:"monospace",marginBottom:2}}>{w.event}</div>
                  <div style={{fontSize:10,color:C.text3}}>{w.url}</div>
                </div>
              </div>
            ))}
            <Btn variant="ghost" style={{width:"100%",fontSize:12,marginTop:8}}>+ Add Webhook</Btn>
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>API Usage</div>
            {[{l:"Requests today",v:"1,240"},{l:"Requests this month",v:"34,800"},{l:"Rate limit",v:"1,000 req/min"},{l:"Avg latency",v:"420ms"}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text2}}>{s.l}</span>
                <span style={{fontSize:12,fontWeight:600,color:C.teal}}>{s.v}</span>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Quick Start</div>
            {[
              {title:"Trigger an agent task",code:`POST /api/agents/trigger\n{\n  "agentId": "aria",\n  "taskType": "outreach_cycle",\n  "payload": { "leads": [...] }\n}`},
              {title:"Query Company Brain",code:`POST /api/brain/query\n{\n  "query": "What is our ICP?",\n  "topK": 5\n}`},
            ].map((ex,i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.text3,marginBottom:6}}>{ex.title}</div>
                <pre style={{background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",fontSize:10,color:C.purple2,fontFamily:"monospace",overflowX:"auto",margin:0,lineHeight:1.6}}>{ex.code}</pre>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>API Endpoints</div>
            {[{m:"GET",path:"/api/agents",desc:"List all AI employees"},{m:"POST",path:"/api/agents/trigger",desc:"Trigger agent task"},{m:"POST",path:"/api/brain/ingest",desc:"Upload document"},{m:"POST",path:"/api/brain/query",desc:"Query Company Brain"},{m:"GET",path:"/api/dashboard",desc:"Get metrics"},{m:"POST",path:"/api/agents/approve/:id",desc:"Approve pending action"},{m:"GET",path:"/api/activity",desc:"Activity feed"},{m:"POST",path:"/webhooks/email-reply",desc:"Inbound email hook"}].map((e,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <span style={{fontSize:10,fontWeight:700,color:e.m==="GET"?C.teal:C.coral,width:36,flexShrink:0}}>{e.m}</span>
                <span style={{fontSize:11,fontFamily:"monospace",color:C.purple2,flex:1}}>{e.path}</span>
                <span style={{fontSize:10,color:C.text3}}>{e.desc}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────
function Settings(){
  const [tab,setTab]=useState("company");
  const [name,setName]=useState("AI BOS Inc.");
  const [email,setEmail]=useState("admin@aibos.ai");
  const [saved,setSaved]=useState(false);
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};

  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>⚙️ Settings</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>Company, agents, notifications, and security</div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {["company","agents","notifications","security"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",borderRadius:8,border:`0.5px solid ${tab===t?C.purple:C.border}`,background:tab===t?"rgba(124,109,250,0.12)":"transparent",color:tab===t?C.purple2:C.text3,fontSize:12,fontWeight:tab===t?600:400,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>

      {tab==="company"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Company Info</div>
            {[{l:"Company Name",v:name,set:setName},{l:"Admin Email",v:email,set:setEmail}].map(f=>(
              <div key={f.l} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.text3,marginBottom:6}}>{f.l}</div>
                <input value={f.v} onChange={e=>f.set(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.04)",border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:13,outline:"none"}}/>
              </div>
            ))}
            <Btn onClick={save} style={{width:"100%"}}>{saved?"✓ Saved!":"Save Changes"}</Btn>
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Preferences</div>
            {[{l:"Agent autonomy default",opts:["Co-pilot","Supervised","Autonomous"],v:"Supervised"},{l:"Approval threshold",opts:["60%","70%","80%","90%"],v:"80%"},{l:"Timezone",opts:["UTC","EST","PST","GMT"],v:"UTC"}].map(f=>(
              <div key={f.l} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.text3,marginBottom:6}}>{f.l}</div>
                <select defaultValue={f.v} style={{width:"100%",padding:"8px 10px",background:C.bg3,border:`0.5px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12,outline:"none"}}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab==="agents"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {AGENTS.map(a=>(
            <Card key={a.id} style={{border:`0.5px solid ${a.color}25`}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{a.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:a.color}}>{a.name} — {a.role}</div>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,color:C.text3,marginBottom:4}}>Autonomy</div>
                    <select defaultValue="Supervised" style={{padding:"5px 8px",background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:6,color:C.text2,fontSize:11,outline:"none"}}>
                      <option>Co-pilot</option><option>Supervised</option><option>Autonomous</option>
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.text3,marginBottom:4}}>Status</div>
                    <select defaultValue="Active" style={{padding:"5px 8px",background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:6,color:C.text2,fontSize:11,outline:"none"}}>
                      <option>Active</option><option>Paused</option><option>Review Mode</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==="notifications"&&(
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Notification Preferences</div>
          {[{l:"Pending approvals",d:"When agents need your approval before acting",on:true},{l:"Churn risk alerts",d:"When Marcus flags a customer at risk",on:true},{l:"Deal closed",d:"When Aria books a meeting or closes a deal",on:true},{l:"Weekly AI report",d:"Sunday summary of all agent activity",on:true},{l:"Budget alerts",d:"When spend exceeds thresholds",on:false},{l:"Agent errors",d:"When an agent fails to complete a task",on:true}].map((n,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{n.l}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:2}}>{n.d}</div>
              </div>
              <div style={{width:36,height:20,borderRadius:10,background:n.on?"rgba(34,211,176,0.3)":"rgba(255,255,255,0.1)",position:"relative",cursor:"pointer"}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:n.on?C.teal:"#555",position:"absolute",top:3,left:n.on?19:3,transition:".2s"}}/>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab==="security"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Security Settings</div>
            {[{l:"Two-Factor Authentication",status:"Enabled",c:C.teal},{l:"SSO / SAML",status:"Not configured",c:C.text3},{l:"API Key Rotation",status:"Every 90 days",c:C.gold},{l:"Audit Logging",status:"Enabled",c:C.teal}].map(s=>(
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.text2}}>{s.l}</span>
                <span style={{fontSize:12,fontWeight:600,color:s.c}}>{s.status}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Team Members</div>
            {[{name:"Alex founder",role:"Owner",email:"alex@aibos.ai"},{name:"Maria ops",role:"Admin",email:"maria@aibos.ai"},{name:"Jordan dev",role:"Developer",email:"jordan@aibos.ai"}].map((m,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,alignItems:"center"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(124,109,250,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.purple2}}>{m.name[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500}}>{m.name}</div>
                  <div style={{fontSize:10,color:C.text3}}>{m.email}</div>
                </div>
                <Badge type="info">{m.role}</Badge>
              </div>
            ))}
            <Btn style={{width:"100%",fontSize:12,marginTop:10}}>+ Invite Member</Btn>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD (simple summary) ────────────────────────
function Dashboard(){
  return(
    <div style={{flex:1,overflow:"auto",padding:"20px",background:C.bg}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:-.5}}>⬛ Dashboard</div>
        <div style={{fontSize:12,color:C.text3,marginTop:2}}>Sunday, June 14, 2026 · AI workforce summary</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"MRR",v:"$47,200",c:C.teal},{l:"Customers",v:"200+",c:C.purple2},{l:"Autonomy Rate",v:"74%",c:C.gold},{l:"Agents Active",v:"5/5",c:C.green}].map(k=>(
          <Card key={k.l} style={{padding:"12px 14px"}}><div style={{fontSize:10,color:C.text3,marginBottom:4}}>{k.l.toUpperCase()}</div><div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div></Card>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Agent Activity Today</div>
          {[{e:"📊",n:"Aria",t:"14 meetings booked · 287 emails sent",c:"#7c6dfa"},{e:"🎧",n:"Marcus",t:"43 tickets resolved · 67% autonomous",c:"#22d3b0"},{e:"📣",n:"Lexi",t:"2 campaigns active · 1.2K impressions",c:"#f06a40"},{e:"💰",n:"Felix",t:"18% API cost spike flagged · report ready",c:"#facc4b"},{e:"⚙️",n:"Nova",t:"6 handoffs coordinated · 4 workflows run",c:"#63c8c8"}].map((a,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`}}>
              <span style={{fontSize:16}}>{a.e}</span>
              <div><span style={{fontSize:12,fontWeight:600,color:a.c}}>{a.n}</span><span style={{fontSize:11,color:C.text2,marginLeft:6}}>{a.t}</span></div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Navigate to Hub</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{icon:"📊",l:"Sales Hub",sub:"Pipeline & Leads"},{icon:"📣",l:"Marketing Hub",sub:"Campaigns"},{icon:"🎧",l:"Support Hub",sub:"Tickets & Chat"},{icon:"💰",l:"Finance Hub",sub:"Revenue & Reports"},{icon:"⚙️",l:"Operations Hub",sub:"Tasks & Workflows"},{icon:"⚡",l:"Command Center",sub:"Execute Goals"}].map((h,i)=>(
              <div key={i} style={{background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}}>
                <div style={{fontSize:16,marginBottom:4}}>{h.icon}</div>
                <div style={{fontSize:12,fontWeight:600}}>{h.l}</div>
                <div style={{fontSize:10,color:C.text3}}>{h.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState("command");
  const VIEWS={command:<CommandV3/>,dashboard:<Dashboard/>,sales:<SalesHub/>,marketing:<MarketingHub/>,support:<SupportHub/>,finance:<FinanceHub/>,operations:<OperationsHub/>,notifications:<Notifications/>,integrations:<Integrations/>,billing:<Billing/>,developer:<Developer/>,settings:<Settings/>};
  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,fontFamily:"'Inter',system-ui,sans-serif",color:C.text,overflow:"hidden"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input,select,textarea{font-family:inherit} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
      <Sidebar view={view} setView={setView}/>
      <div style={{flex:1,overflow:"hidden",display:"flex"}}>
        {VIEWS[view]||<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.text3}}>Coming soon</div>}
      </div>
    </div>
  );
}
