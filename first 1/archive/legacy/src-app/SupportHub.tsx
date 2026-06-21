import { useEffect, useState } from 'react'
import { C } from '../design'
import { Card, Btn, Badge, Pill, Spin, KpiGrid } from '../components/ui'
import { callAI, callAIWithHistory } from '../utils/ai'
import { AgentTask, SharedMemory, getAgentTasks, getSharedMemory } from '../utils/collaboration'
import { useOrgId } from '../context/OrgContext'

const TICKETS = [
  { id:'T-001', customer:'Nexus AI',   email:'sarah@nexusai.co',     subject:'AI agents stopped sending emails after Slack integration', status:'Open',        priority:'High',   created:'2h ago',  ai:true  },
  { id:'T-002', customer:'FlowStack',  email:'m.reid@flowstack.com', subject:'How do I add custom brand voice to Company Brain?',         status:'In Progress', priority:'Medium', created:'4h ago',  ai:true  },
  { id:'T-003', customer:'Orbis Labs', email:'priya@orbis.io',        subject:'Billing question — upgrading from Growth to Team',          status:'Open',        priority:'Low',    created:'6h ago',  ai:false },
  { id:'T-004', customer:'Clearpath',  email:'alex@clearpath.ai',    subject:'Aria booked a meeting at wrong time — calendar sync issue', status:'Escalated',   priority:'High',   created:'1d ago',  ai:false },
  { id:'T-005', customer:'TechFlow',   email:'jordan@techflow.io',   subject:'Feature request: export activity log to CSV',               status:'Resolved',    priority:'Low',    created:'2d ago',  ai:true  },
]

const MARCUS_SYS = `You are Marcus, AI Customer Support specialist for AI BOS. Empathetic, solution-focused, proactive about churn. Write a professional support response that: 1) acknowledges the issue empathetically, 2) provides clear step-by-step resolution, 3) ends with confidence-restoring statement. AI BOS is an AI Business Operating System.`

export default function SupportHub() {
  const orgId = useOrgId()
  const [view, setView] = useState('tickets')
  const [tickets, setTickets] = useState(TICKETS)
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [chat, setChat] = useState([{ role:'assistant', text:"Hi! I'm Marcus, your AI Support agent. I'm here 24/7. What can I help you with today?" }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [supportTasks, setSupportTasks] = useState<AgentTask[]>([])
  const [supportMemory, setSupportMemory] = useState<SharedMemory[]>([])

  useEffect(() => {
    getAgentTasks('support', orgId).then(setSupportTasks).catch(() => {})
    getSharedMemory('lead', orgId).then(setSupportMemory).catch(() => {})
  }, [orgId])

  const draftReply = async (ticket: typeof TICKETS[0]) => {
    setDrafting(true); setReply('')
    try {
      const text = await callAI(MARCUS_SYS, `Ticket from ${ticket.customer}: "${ticket.subject}". Priority: ${ticket.priority}.`, 500)
      setReply(text)
    } catch(e: any) { setReply(`Error: ${e.message}`) }
    setDrafting(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput; setChatInput('')
    setChat(p => [...p, { role:'user', text:msg }])
    setChatLoading(true)
    try {
      const msgs = [...chat.map(m => ({ role:m.role==='user'?'user':'assistant', content:m.text })), { role:'user', content:msg }]
      const text = await callAIWithHistory(MARCUS_SYS, msgs, 400)
      setChat(p => [...p, { role:'assistant', text }])
    } catch(e: any) { setChat(p => [...p, { role:'assistant', text:`Sorry, I had trouble connecting. ${(e as any).message}` }]) }
    setChatLoading(false)
  }

  const statusColor = (s: string) => ({ Open:C.gold, 'In Progress':C.purple2, Escalated:C.coral, Resolved:C.teal }[s] || C.text3)
  const priorityColor = (p: string) => ({ High:C.coral, Medium:C.gold, Low:C.teal }[p] || C.text3)

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>🎧 Support Hub</div><div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Marcus handles tickets, chat, and churn prevention 24/7</div></div>
        <div style={{ display:'flex', gap:8 }}>
          {[{v:'tickets',l:'Tickets'},{v:'livechat',l:'Live Chat'},{v:'kb',l:'Knowledge Base'}].map(t => (
            <button key={t.v} onClick={() => setView(t.v)} style={{ padding:'6px 12px', borderRadius:8, border:`0.5px solid ${view===t.v?C.teal:C.border}`, background:view===t.v?'rgba(34,211,176,0.12)':'transparent', color:view===t.v?C.teal:C.text3, fontSize:12, cursor:'pointer' }}>{t.l}</button>
          ))}
        </div>
      </div>

      <KpiGrid items={[
        { label:'Open Tickets', value:tickets.filter(t=>t.status==='Open').length, color:C.gold },
        { label:'Auto-Resolved', value:'29', sub:'Today', color:C.teal },
        { label:'Escalated', value:tickets.filter(t=>t.status==='Escalated').length, color:C.coral },
        { label:'Avg Response', value:'< 2 min', color:C.purple2 },
      ]}/>

      {view==='tickets' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:14 }}>
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Support Tickets</span>
              <div style={{ display:'flex', gap:6 }}>
                {['All','Open','Escalated'].map(f => <button key={f} style={{ padding:'4px 10px', borderRadius:20, border:`0.5px solid ${C.border}`, background:'transparent', color:C.text3, fontSize:11, cursor:'pointer' }}>{f}</button>)}
              </div>
            </div>
            {tickets.map(t => (
              <div key={t.id} onClick={() => { setSelected(t); draftReply(t); }} style={{ display:'flex', gap:12, padding:'12px', background:selected?.id===t.id?'rgba(34,211,176,0.06)':'transparent', border:`0.5px solid ${selected?.id===t.id?C.teal:C.border}`, borderRadius:8, marginBottom:6, cursor:'pointer' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>{t.customer}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={{ fontSize:10, color:priorityColor(t.priority) }}>{t.priority}</span>
                      <span style={{ fontSize:10, color:statusColor(t.status), fontWeight:600 }}>{t.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.text2, marginBottom:4 }}>{t.subject}</div>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:10, color:C.text3 }}>{t.id} · {t.created}</span>
                    {t.ai && <span style={{ fontSize:10, color:C.teal }}>🎧 AI can resolve</span>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <div>
            <Card style={{ marginBottom:14, border:`0.5px solid rgba(34,211,176,0.25)`, background:'rgba(34,211,176,0.04)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:8 }}>Marcus Handoff Context</div>
              {supportTasks.length === 0 ? (
                <div style={{ fontSize:12, color:C.text3 }}>No Sales handoffs yet.</div>
              ) : supportTasks.slice(0,3).map(t => {
                const ctx = supportMemory.find(m => m.memory_key === `lead:${t.payload?.leadId}:support_context`)
                return (
                  <div key={t.id} style={{ padding:'9px 0', borderTop:`0.5px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{t.task_type.replace(/_/g,' ')}</span>
                      <Badge type={t.status==='completed'?'success':'warning'}>{t.status}</Badge>
                    </div>
                    <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>Workflow {t.workflow_id}</div>
                    {ctx && (
                      <div style={{ marginTop:6, fontSize:11, color:C.text2, lineHeight:1.6 }}>
                        {ctx.value?.lead?.name} from {ctx.value?.lead?.company || 'unknown company'} came through {ctx.value?.campaign?.name}. Marcus has the campaign and outreach history before a ticket is opened.
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
            {selected ? (
              <Card>
                <div style={{ fontSize:12, fontWeight:700, color:C.teal, marginBottom:10 }}>🎧 Marcus's Reply Draft</div>
                <div style={{ fontSize:11, color:C.text3, marginBottom:8 }}>{selected.id} · {selected.customer} · {selected.subject.slice(0,40)}…</div>
                {drafting ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:C.text3, fontSize:12, padding:'20px 0' }}><Spin size={12} color={C.teal}/>Marcus is drafting…</div>
                ) : (
                  <div>
                    <textarea value={reply} onChange={e => setReply(e.target.value)} style={{ width:'100%', minHeight:200, padding:'10px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:12, lineHeight:1.7, outline:'none', resize:'vertical', fontFamily:'inherit' }}/>
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <Btn variant="teal" style={{ flex:1, fontSize:11 }}>✓ Send Reply</Btn>
                      <Btn variant="danger" style={{ flex:1, fontSize:11 }}>↑ Escalate</Btn>
                    </div>
                    <button onClick={() => draftReply(selected)} style={{ marginTop:8, width:'100%', padding:'6px', background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text3, fontSize:11, cursor:'pointer' }}>↺ Regenerate</button>
                  </div>
                )}
              </Card>
            ) : <Card style={{ textAlign:'center', padding:'40px' }}><div style={{ fontSize:12, color:C.text3 }}>Select a ticket to draft an AI reply</div></Card>}
          </div>
        </div>
      )}

      {view==='livechat' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card style={{ display:'flex', flexDirection:'column', height:420 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:C.teal }}>🎧 Live Chat with Marcus</div>
            <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
              {chat.map((m,i) => (
                <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'80%', padding:'8px 12px', borderRadius:8, background:m.role==='user'?'rgba(124,109,250,0.15)':'rgba(34,211,176,0.1)', border:`0.5px solid ${m.role==='user'?'rgba(124,109,250,0.3)':'rgba(34,211,176,0.25)'}`, fontSize:12, color:C.text, lineHeight:1.6 }}>{m.text}</div>
                </div>
              ))}
              {chatLoading && <div style={{ display:'flex', alignItems:'center', gap:6, color:C.text3, fontSize:11 }}><Spin size={10} color={C.teal}/>Marcus is typing…</div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&sendChat()} placeholder="Type your question…" style={{ flex:1, padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:12, outline:'none' }}/>
              <Btn variant="teal" onClick={sendChat} disabled={chatLoading} style={{ padding:'8px 14px' }}>Send</Btn>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Quick Stats</div>
            {[{l:'Churn risks flagged',v:3,c:C.coral},{l:'Tickets resolved today',v:29,c:C.teal},{l:'Avg CSAT score',v:'4.8/5',c:C.gold},{l:'KB articles created',v:14,c:C.purple2}].map(s => (
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`0.5px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.text2 }}>{s.l}</span>
                <span style={{ fontSize:14, fontWeight:700, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==='kb' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Knowledge Base Articles</div>
            {[{t:'How to set up Company Brain',v:142,cat:'Setup'},{t:'Configuring agent autonomy levels',v:98,cat:'Agents'},{t:'Gmail integration troubleshooting',v:234,cat:'Integrations'},{t:'Pricing and plan comparison',v:189,cat:'Billing'},{t:'How Aria scores leads',v:67,cat:'Sales'},{t:'CRM sync — HubSpot & Salesforce',v:123,cat:'Integrations'}].map((a,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500 }}>{a.t}</div>
                  <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{a.cat} · {a.v} views</div>
                </div>
                <Pill color={C.teal} bg="rgba(34,211,176,0.1)">{a.cat}</Pill>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:C.teal }}>🎧 Marcus Auto-Created</div>
            <div style={{ fontSize:12, color:C.text2, marginBottom:12, lineHeight:1.6 }}>Marcus automatically creates KB articles from resolved tickets.</div>
            {[{t:'Fix: Agent emails stop after CRM reconnect',from:'T-001'},{t:'How to customize brand voice step-by-step',from:'T-002'},{t:'Calendar sync — common timezone issues',from:'T-004'}].map((a,i) => (
              <div key={i} style={{ background:'rgba(34,211,176,0.06)', border:`0.5px solid rgba(34,211,176,0.2)`, borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>{a.t}</div>
                <div style={{ fontSize:10, color:C.text3 }}>Auto-created from {a.from}</div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
