import { useState } from 'react'
import { C, AGENTS } from '../design'
import { Card, Btn, Pill, Spin } from '../components/ui'
import { callAI } from '../utils/ai'

const CMD_SYS = `You are AI BOS Command Intelligence — the central brain of an AI Business Operating System.

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

COMPANY: AI BOS · Plans: $299/$799/$1,999/mo · MRR: $47,200 · ICP: funded startups 5-200 employees`

const AGENT_PROMPTS: Record<string,string> = {
  aria:   `You are Aria, elite AI Sales SDR for AI BOS. Be specific, human, produce one concrete output (email/plan). AI BOS plans: $299/$799/$1,999/mo.`,
  marcus: `You are Marcus, AI Support specialist for AI BOS. Empathetic, solution-focused, proactive about churn. Produce one concrete action.`,
  lexi:   `You are Lexi, AI Marketing Manager for AI BOS. Bold, direct, outcome-focused. Produce one concrete deliverable.`,
  felix:  `You are Felix, AI Finance Analyst for AI BOS. Numbers first. Structure: Summary → Signals → Recommendation.`,
  nova:   `You are Nova, AI Operations Lead for AI BOS. Coordinate across agents. Produce a specific cross-functional action plan.`,
}

const THINKING = ['Analyzing business goal…','Querying Company Brain…','Mapping cross-department dependencies…','Assigning tasks to AI employees…','Calculating expected impact…','Building execution plan…']

export default function CommandCenter() {
  const [cmd, setCmd] = useState('')
  const [phase, setPhase] = useState<'idle'|'planning'|'ready'|'executing'|'done'>('idle')
  const [plan, setPlan] = useState<any>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [outputs, setOutputs] = useState<Record<number,string>>({})
  const [running, setRunning] = useState<number|null>(null)
  const [done, setDone] = useState<Record<number,boolean>>({})
  const [execPhase, setExecPhase] = useState<'idle'|'running'|'done'>('idle')
  const [err, setErr] = useState('')

  const generate = async () => {
    if (!cmd.trim()) return
    setPhase('planning'); setPlan(null); setOutputs({}); setDone({}); setErr(''); setSteps([])
    for (let i=0; i<THINKING.length; i++) {
      await new Promise(r => setTimeout(r, 380))
      setSteps(p => [...p, THINKING[i]])
    }
    try {
      const text = await callAI(CMD_SYS, cmd, 2000)
      setPlan(JSON.parse(text.replace(/```json|```/g,'').trim()))
      setPhase('ready')
    } catch(e: any) {
      setErr(e.message || 'Failed to generate plan. Check your Anthropic API key in Secrets.')
      setPhase('idle')
    }
  }

  const runAgent = async (task: any, idx: number) => {
    if (running !== null) return
    setRunning(idx)
    const a = AGENTS.find(x => x.id === task.agentId) || AGENTS[0]
    try {
      const prompt = `GOAL: ${plan.goal}\nTASK: ${task.title}\n${task.description}\nACTIONS:\n${task.actions.map((a:string,i:number)=>`${i+1}. ${a}`).join('\n')}\nKPI: ${task.kpi}\nTIMEFRAME: ${task.timeframe}\n\nProvide: 1) Your execution approach (2-3 sentences) 2) ONE concrete deliverable 3) What you hand off next`
      const text = await callAI(AGENT_PROMPTS[task.agentId] || AGENT_PROMPTS.nova, prompt, 700)
      setOutputs(p => ({ ...p, [idx]: text }))
      setDone(p => ({ ...p, [idx]: true }))
    } catch(e: any) {
      setOutputs(p => ({ ...p, [idx]: `Error: ${e.message}` }))
    }
    setRunning(null)
  }

  const runAll = async () => {
    if (!plan) return
    setExecPhase('running')
    for (let i=0; i<plan.tasks.length; i++) {
      if (!done[i]) await runAgent(plan.tasks[i], i)
      await new Promise(r => setTimeout(r, 200))
    }
    setExecPhase('done')
  }

  const pc = (p: string) => p==='critical'?C.coral:p==='high'?C.gold:C.teal

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>⚡ Command Center</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>One goal → entire company executes · real AI agents respond</div>
      </div>

      <Card style={{ marginBottom:16, background:'rgba(124,109,250,0.05)', border:`0.5px solid rgba(124,109,250,0.3)` }}>
        <textarea value={cmd} onChange={e => setCmd(e.target.value)}
          placeholder="e.g. Increase revenue by 20% this quarter…"
          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:13, lineHeight:1.6, resize:'none', minHeight:68, outline:'none', fontFamily:'inherit' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['Increase revenue 20%','Reduce churn — 3 at-risk customers','Launch new feature campaign','Close 5 stalled deals','Prepare board report'].map((ex,i) => (
              <button key={i} onClick={() => setCmd(ex)} style={{ padding:'3px 9px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border}`, borderRadius:20, fontSize:11, color:C.text3, cursor:'pointer' }}>{ex}</button>
            ))}
          </div>
          <Btn onClick={generate} disabled={phase==='planning'||!cmd.trim()} style={{ display:'flex', alignItems:'center', gap:6, minWidth:150, justifyContent:'center' }}>
            {phase==='planning' ? <><Spin/>Generating…</> : '⚡ Generate Plan'}
          </Btn>
        </div>
      </Card>

      {err && (
        <Card style={{ marginBottom:16, background:'rgba(240,106,64,0.06)', border:`0.5px solid rgba(240,106,64,0.3)` }}>
          <div style={{ fontSize:13, color:C.coral }}>⚠ {err}</div>
          <div style={{ fontSize:11, color:C.text3, marginTop:4 }}>Add your <strong>ANTHROPIC_API_KEY</strong> in Replit Secrets to enable AI features.</div>
        </Card>
      )}

      {phase==='planning' && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.purple2, marginBottom:10 }}>🧠 Command Intelligence thinking…</div>
          {steps.map((s,i) => <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:C.text2, fontSize:12, marginBottom:6 }}><span style={{ color:C.teal, fontWeight:700 }}>✓</span>{s}</div>)}
          {steps.length < THINKING.length && <div style={{ display:'flex', alignItems:'center', gap:8, color:C.text3, fontSize:12 }}><Spin size={11} color={C.purple}/>{THINKING[steps.length]}</div>}
        </Card>
      )}

      {plan && (
        <div>
          <Card style={{ marginBottom:14, background:'rgba(124,109,250,0.06)', border:`0.5px solid rgba(124,109,250,0.3)` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:800, letterSpacing:-.3, marginBottom:6 }}>{plan.goal}</div>
                <div style={{ fontSize:12, color:C.text2, lineHeight:1.6, marginBottom:8 }}>{plan.summary}</div>
                {plan.crossDeps?.length>0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {plan.crossDeps.map((d:string,i:number) => <span key={i} style={{ fontSize:11, color:C.purple2, background:'rgba(124,109,250,0.1)', borderRadius:6, padding:'2px 8px' }}>→ {d}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                {[{l:'Timeline',v:plan.timeline,c:C.teal},{l:'Impact',v:plan.expectedImpact,c:C.purple2},{l:'Confidence',v:`${plan.confidence}%`,c:C.gold}].map(m => (
                  <div key={m.l} style={{ textAlign:'center', padding:'8px 14px', background:`${m.c}12`, borderRadius:8, border:`0.5px solid ${m.c}30` }}>
                    <div style={{ fontSize:9, color:C.text3, marginBottom:2 }}>{m.l.toUpperCase()}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:m.c }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
            {execPhase==='idle' && (
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <Btn onClick={runAll} style={{ background:C.grad, border:'none', display:'flex', alignItems:'center', gap:6 }}>🚀 Execute All Agents</Btn>
                <Btn variant="ghost">📋 Export Plan</Btn>
              </div>
            )}
            {execPhase==='running' && <div style={{ marginTop:10, fontSize:12, color:C.purple2, display:'flex', alignItems:'center', gap:8 }}><Spin color={C.purple}/>Executing across {plan.tasks?.length} agents…</div>}
            {execPhase==='done' && <div style={{ marginTop:10, fontSize:12, color:C.teal, fontWeight:600 }}>✓ Full workforce deployed — all agents executing</div>}
          </Card>

          <div style={{ fontSize:10, color:C.text3, letterSpacing:.5, textTransform:'uppercase', marginBottom:10 }}>{plan.tasks?.length} Agent Tasks</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {plan.tasks?.map((task:any, i:number) => {
              const a = AGENTS.find(x => x.id===task.agentId) || AGENTS[0]
              const isRunning = running===i
              const isDone = !!done[i]
              const out = outputs[i]
              return (
                <Card key={i} style={{ border:`0.5px solid ${a.color}30`, background:isDone?'rgba(34,211,176,0.02)':C.bg2 }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{a.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
                        <span style={{ fontWeight:700, color:a.color, fontSize:13 }}>{a.name}</span>
                        <Pill color={pc(task.priority)} bg={`${pc(task.priority)}18`}>{task.priority}</Pill>
                        <span style={{ fontSize:10, color:C.text3 }}>⏱ {task.timeframe}</span>
                        {task.estimatedValue && <Pill color={C.gold} bg="rgba(250,204,75,0.1)">{task.estimatedValue}</Pill>}
                        {isDone && <Pill color={C.teal} bg="rgba(34,211,176,0.12)">✓ Executed</Pill>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{task.title}</div>
                      <div style={{ fontSize:12, color:C.text2, marginBottom:8, lineHeight:1.5 }}>{task.description}</div>
                      <div style={{ marginBottom:8 }}>{task.actions?.map((ac:string,j:number) => <div key={j} style={{ display:'flex', gap:6, fontSize:11, color:C.text2, marginBottom:3 }}><span style={{ color:a.color, fontWeight:700 }}>→</span>{ac}</div>)}</div>
                      <div style={{ fontSize:10, color:C.text3, marginBottom:8 }}>KPI: <span style={{ color:C.gold }}>{task.kpi}</span></div>
                      {isRunning && <div style={{ background:'rgba(124,109,250,0.06)', border:`0.5px solid rgba(124,109,250,0.25)`, borderRadius:8, padding:'10px 12px', marginBottom:8 }}><div style={{ display:'flex', alignItems:'center', gap:6, color:C.purple2, fontSize:11 }}><Spin size={11} color={C.purple}/>{a.name} is executing…</div></div>}
                      {out && <div style={{ background:`${a.color}08`, border:`0.5px solid ${a.color}30`, borderRadius:8, padding:'12px 14px', marginBottom:8 }}><div style={{ fontSize:10, color:a.color, fontWeight:600, marginBottom:6, textTransform:'uppercase' }}>{a.name}'s Output</div><div style={{ fontSize:12, color:C.text, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{out}</div></div>}
                      {!isDone && !isRunning && <Btn onClick={() => runAgent(task,i)} disabled={running!==null} style={{ fontSize:11, padding:'5px 12px', background:a.color }}>Run {a.name} →</Btn>}
                      {isDone && <span style={{ fontSize:11, color:C.teal }}>✓ Agent deployed</span>}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {execPhase==='done' && (
            <Card style={{ marginTop:16, textAlign:'center', background:'rgba(34,211,176,0.05)', border:`0.5px solid rgba(34,211,176,0.3)` }}>
              <div style={{ fontSize:28, marginBottom:6 }}>🚀</div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:4 }}>Full workforce deployed</div>
              <div style={{ fontSize:12, color:C.text2 }}>All {plan.tasks?.length} agents executing autonomously.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
