import { useState } from 'react'
import { C, AGENTS } from '../design'
import { Card, Btn, Badge, Pill, Spin, KpiGrid } from '../components/ui'
import { callAI } from '../utils/ai'

const NOVA_SYS = `You are Nova, AI Operations Lead for AI BOS. You coordinate all agents, manage workflows, and optimize processes. Be specific. Produce a numbered action plan with agent assignments and timelines. Format: 🎯 Objective → 📋 Steps (with agent) → ⏱ Timeline → 🔗 Dependencies`

const WORKFLOWS = [
  { id:1, name:'Lead → Deal Handoff', agents:['aria','nova'], status:'Active', runs:24, lastRun:'2h ago', successRate:96 },
  { id:2, name:'Churn Risk Detection', agents:['marcus','felix'], status:'Active', runs:8, lastRun:'3h ago', successRate:100 },
  { id:3, name:'New Customer Onboarding', agents:['marcus','lexi'], status:'Active', runs:3, lastRun:'1d ago', successRate:100 },
  { id:4, name:'Monthly Revenue Report', agents:['felix','nova'], status:'Scheduled', runs:1, lastRun:'Jun 1', successRate:100 },
  { id:5, name:'Content → Lead Attribution', agents:['lexi','aria'], status:'Paused', runs:12, lastRun:'5d ago', successRate:83 },
]

export default function OperationsHub() {
  const [view, setView] = useState('workflows')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState('')
  const [task, setTask] = useState('')

  const planWorkflow = async () => {
    if (!task.trim() || loading) return
    setLoading(true); setPlan('')
    try {
      const ctx = `Available agents: Aria (Sales), Marcus (Support), Lexi (Marketing), Felix (Finance), Nova (Operations). Company: AI BOS, $47,200 MRR.`
      const text = await callAI(NOVA_SYS, `${ctx}\n\nCreate a cross-agent workflow for: ${task}`, 600)
      setPlan(text)
    } catch(e: any) { setPlan(`Error: ${e.message}`) }
    setLoading(false)
  }

  const agentColors: Record<string,string> = { aria:'#7c6dfa', marcus:'#22d3b0', lexi:'#f06a40', felix:'#facc4b', nova:'#63c8c8' }

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>⚙️ Operations Hub</div><div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Nova coordinates all agents and cross-functional workflows</div></div>
        <div style={{ display:'flex', gap:8 }}>
          {['workflows','agents','nova','automation'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'6px 14px', borderRadius:8, border:`0.5px solid ${view===v?'#63c8c8':C.border}`, background:view===v?'rgba(99,200,200,0.12)':'transparent', color:view===v?'#63c8c8':C.text3, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{v==='nova'?'⚙️ Ask Nova':v}</button>
          ))}
        </div>
      </div>

      <KpiGrid items={[
        { label:'Active Workflows', value:WORKFLOWS.filter(w=>w.status==='Active').length, color:'#63c8c8' },
        { label:'Tasks Automated', value:'133', sub:'This month', color:C.teal },
        { label:'Agent Handoffs', value:'47', sub:'Zero errors', color:C.purple2 },
        { label:'Avg Success Rate', value:'95.8%', color:C.gold },
      ]}/>

      {view==='workflows' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Cross-Agent Workflows</span>
            <Btn style={{ fontSize:11, padding:'5px 12px' }}>+ New Workflow</Btn>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {WORKFLOWS.map(w => (
              <Card key={w.id}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{w.name}</span>
                      <Badge type={w.status==='Active'?'success':w.status==='Paused'?'warning':'info'}>{w.status}</Badge>
                    </div>
                    <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                      {w.agents.map(a => {
                        const ag = AGENTS.find(x => x.id===a)
                        return ag ? <span key={a} style={{ padding:'2px 8px', background:`${agentColors[a]}18`, borderRadius:20, fontSize:10, fontWeight:600, color:agentColors[a] }}>{ag.emoji} {ag.name}</span> : null
                      })}
                    </div>
                    <div style={{ display:'flex', gap:16 }}>
                      <span style={{ fontSize:11, color:C.text3 }}>Runs: <strong style={{ color:C.text }}>{w.runs}</strong></span>
                      <span style={{ fontSize:11, color:C.text3 }}>Last: <strong style={{ color:C.text }}>{w.lastRun}</strong></span>
                      <span style={{ fontSize:11, color:C.text3 }}>Success: <strong style={{ color:w.successRate>90?C.teal:C.gold }}>{w.successRate}%</strong></span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn variant="ghost" style={{ fontSize:11, padding:'5px 12px' }}>View Runs</Btn>
                    {w.status==='Active' ? <Btn variant="ghost" style={{ fontSize:11, padding:'5px 12px' }}>Pause</Btn> : <Btn style={{ fontSize:11, padding:'5px 12px' }}>Resume</Btn>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view==='agents' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {AGENTS.map(a => (
            <Card key={a.id} style={{ border:`0.5px solid ${a.color}25` }}>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{a.emoji}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:a.color }}>{a.name}</div>
                  <div style={{ fontSize:12, color:C.text3 }}>{a.role}</div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:C.teal, boxShadow:`0 0 6px ${C.teal}` }}/>
                  <span style={{ fontSize:10, color:C.teal }}>Online</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                {[{l:'Tasks today',v:{aria:'47',marcus:'43',lexi:'12',felix:'8',nova:'23'}[a.id]},{l:'Success rate',v:{aria:'92%',marcus:'87%',lexi:'95%',felix:'100%',nova:'89%'}[a.id]}].map(s => (
                  <div key={s.l} style={{ background:C.bg3, borderRadius:6, padding:'8px' }}>
                    <div style={{ fontSize:9, color:C.text3, marginBottom:2 }}>{s.l.toUpperCase()}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:a.color }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ flex:1, padding:'6px', background:`${a.color}12`, border:`0.5px solid ${a.color}30`, borderRadius:6, color:a.color, fontSize:11, fontWeight:600, cursor:'pointer' }}>View Activity</button>
                <button style={{ flex:1, padding:'6px', background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text3, fontSize:11, cursor:'pointer' }}>Assign Task</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {view==='nova' && (
        <div>
          <Card style={{ marginBottom:14, background:'rgba(99,200,200,0.05)', border:`0.5px solid rgba(99,200,200,0.3)` }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#63c8c8', marginBottom:10 }}>⚙️ Ask Nova — Workflow Designer</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => e.key==='Enter'&&planWorkflow()}
                placeholder="e.g. Automate the entire customer onboarding process"
                style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}/>
              <Btn onClick={planWorkflow} disabled={loading} style={{ background:'#63c8c8', border:'none' }}>
                {loading?<><Spin size={12}/>Planning…</>:'Plan Workflow →'}
              </Btn>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Automate customer onboarding','Create churn prevention workflow','Coordinate product launch','Build lead scoring process','Monthly board report pipeline'].map(t => (
                <button key={t} onClick={() => setTask(t)} style={{ padding:'4px 10px', background:'rgba(99,200,200,0.1)', border:`0.5px solid rgba(99,200,200,0.25)`, borderRadius:20, color:'#63c8c8', fontSize:11, cursor:'pointer' }}>{t}</button>
              ))}
            </div>
          </Card>
          {plan && (
            <Card style={{ background:'rgba(99,200,200,0.04)', border:`0.5px solid rgba(99,200,200,0.25)` }}>
              <div style={{ fontSize:11, color:'#63c8c8', fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>⚙️ Nova's Workflow Plan</div>
              <div style={{ fontSize:14, lineHeight:1.9, color:C.text, whiteSpace:'pre-wrap' }}>{plan}</div>
            </Card>
          )}
        </div>
      )}

      {view==='automation' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Automation Rules</div>
            {[
              { name:'Lead score > 80 → Assign to Aria immediately', status:'On' },
              { name:'Ticket open > 24h → Escalate to human', status:'On' },
              { name:'Customer MRR drops → Marcus sends retention offer', status:'On' },
              { name:'New signup → Lexi triggers onboarding email', status:'On' },
              { name:'Invoice > 7d overdue → Felix sends reminder', status:'Off' },
              { name:'Trial day 10 → Aria schedules upgrade call', status:'On' },
            ].map((rule,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                <span style={{ fontSize:12, color:C.text2, flex:1, paddingRight:12 }}>{rule.name}</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:36, height:18, borderRadius:9, background:rule.status==='On'?C.teal:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', padding:'2px', cursor:'pointer', transition:'.2s' }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', transition:'.2s', transform:rule.status==='On'?'translateX(18px)':'translateX(0)' }}/>
                  </div>
                  <span style={{ fontSize:10, color:rule.status==='On'?C.teal:C.text3 }}>{rule.status}</span>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Recent Automation Log</div>
            {[{t:'Aria contacted high-score lead: Jordan Blake',time:'2h ago',ok:true},{t:'Marcus detected churn risk: FlowStack',time:'3h ago',ok:true},{t:'Lexi sent onboarding email to new trial',time:'5h ago',ok:true},{t:'Felix generated monthly cost report',time:'8h ago',ok:true},{t:'Nova coordinated deal handoff: TechFlow',time:'1d ago',ok:true},{t:'Billing reminder failed — retrying',time:'2d ago',ok:false}].map((log,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                <span style={{ fontSize:12, color:log.ok?C.teal:C.coral }}>{log.ok?'✓':'✕'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.text2 }}>{log.t}</div>
                  <div style={{ fontSize:10, color:C.text3 }}>{log.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
