import { useState } from 'react'
import { C } from '../design'
import { Card, Btn, Badge, Pill } from '../components/ui'

const AGENT_CATALOG = [
  { id:'p1', name:'Aria Pro — SDR Elite',    emoji:'📊', category:'Sales',     price:49,  rating:4.9, reviews:234, desc:'Advanced SDR with multi-channel outreach, A/B tested sequences, objection handling library, and CRM auto-update. Includes 50+ proven email templates.', tags:['Email','LinkedIn','CRM'], installed:true  },
  { id:'p2', name:'Deal Closer',             emoji:'🤝', category:'Sales',     price:79,  rating:4.8, reviews:89,  desc:'Takes over from Aria at proposal stage. Analyzes objections, drafts custom proposals, negotiates terms, and pushes deals to close.', tags:['Proposals','Negotiation'], installed:false },
  { id:'p3', name:'Marcus Premium',          emoji:'🎧', category:'Support',   price:39,  rating:4.9, reviews:412, desc:'Full support suite: ticket deflection, CSAT tracking, knowledge base auto-building, churn prediction, and proactive outreach to at-risk accounts.', tags:['Tickets','Chat','KB'], installed:true  },
  { id:'p4', name:'Lexi Content Engine',     emoji:'📣', category:'Marketing', price:59,  rating:4.7, reviews:156, desc:'Full content machine: blog posts, LinkedIn, email sequences, SEO optimization, and competitor analysis. Creates and schedules 30+ pieces/month.', tags:['Content','SEO','Social'], installed:false },
  { id:'p5', name:'Felix CFO Suite',         emoji:'💰', category:'Finance',   price:99,  rating:4.9, reviews:78,  desc:'Full CFO capabilities: automated P&L, cash flow forecasting, investor reporting, tax prep summaries, and real-time budget alerts.', tags:['Accounting','Forecasts','Reports'], installed:false },
  { id:'p6', name:'PR & Media Agent',        emoji:'📰', category:'Marketing', price:69,  rating:4.6, reviews:43,  desc:'Writes and distributes press releases, monitors brand mentions, drafts responses to media inquiries, and pitches journalists.', tags:['PR','Media','Brand'], installed:false },
  { id:'p7', name:'HR Recruiting Agent',     emoji:'👥', category:'HR',        price:89,  rating:4.7, reviews:67,  desc:'Sources candidates, screens resumes, schedules interviews, sends offer letters, and onboards new hires. Cuts time-to-hire by 60%.', tags:['Recruiting','Hiring','Onboarding'], installed:false },
  { id:'p8', name:'Legal Review Agent',      emoji:'⚖️', category:'Legal',     price:129, rating:4.8, reviews:34,  desc:'Reviews contracts, flags risky clauses, drafts NDAs and service agreements, and tracks compliance requirements. Not a lawyer substitute.', tags:['Contracts','Compliance','NDA'], installed:false },
  { id:'p9', name:'E-Commerce Manager',      emoji:'🛒', category:'E-Commerce',price:79,  rating:4.7, reviews:122, desc:'Manages Shopify/WooCommerce: product descriptions, pricing optimization, inventory alerts, abandoned cart recovery, and review responses.', tags:['Shopify','Products','Revenue'], installed:false },
]

const CATEGORIES = ['All','Sales','Marketing','Support','Finance','HR','Legal','E-Commerce']

export default function Marketplace() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [installed, setInstalled] = useState(new Set(['p1','p3']))
  const [view, setView] = useState<any>(null)

  const filtered = AGENT_CATALOG.filter(a => (cat==='All'||a.category===cat) && (a.name.toLowerCase().includes(search.toLowerCase())||a.desc.toLowerCase().includes(search.toLowerCase())))

  const catColor = (c: string) => ({ Sales:C.purple2, Marketing:C.coral, Support:C.teal, Finance:C.gold, HR:C.green, Legal:C.text2, 'E-Commerce':'#a594ff' }[c] || C.text2)

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>🏪 Agent Marketplace</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Expand your AI workforce with specialized agents</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[{l:'Agents Available',v:AGENT_CATALOG.length,c:C.teal},{l:'Installed',v:installed.size,c:C.purple2},{l:'Categories',v:CATEGORIES.length-1,c:C.gold},{l:'Avg Rating',v:'4.8 ★',c:C.coral}].map(k => (
          <Card key={k.l} style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.text3, marginBottom:3 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents…"
          style={{ flex:1, minWidth:200, padding:'8px 14px', background:C.bg2, border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}/>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:'6px 14px', borderRadius:20, border:`0.5px solid ${cat===c?C.purple:C.border}`, background:cat===c?'rgba(124,109,250,0.12)':'transparent', color:cat===c?C.purple2:C.text3, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>{c}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map(a => (
          <Card key={a.id} style={{ border:`0.5px solid ${C.border}`, position:'relative' }}>
            {installed.has(a.id) && <div style={{ position:'absolute', top:12, right:12 }}><Badge type="success">Installed</Badge></div>}
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:`${catColor(a.category)}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{a.emoji}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{a.name}</div>
                <div style={{ fontSize:11, color:catColor(a.category) }}>{a.category}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:C.text2, lineHeight:1.6, marginBottom:10 }}>{a.desc}</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
              {a.tags.map(t => <Pill key={t} color={C.text3} bg="rgba(255,255,255,0.06)" style={{ fontSize:10 }}>{t}</Pill>)}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.teal }}>+${a.price}/mo</div>
                <div style={{ fontSize:10, color:C.text3 }}>★ {a.rating} ({a.reviews} reviews)</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Btn variant="ghost" onClick={() => setView(a)} style={{ fontSize:11, padding:'5px 10px' }}>Details</Btn>
                {installed.has(a.id) ? (
                  <Btn variant="danger" onClick={() => setInstalled(p => { const n=new Set(p); n.delete(a.id); return n; })} style={{ fontSize:11, padding:'5px 10px' }}>Remove</Btn>
                ) : (
                  <Btn onClick={() => setInstalled(p => new Set([...p, a.id]))} style={{ fontSize:11, padding:'5px 10px' }}>Install</Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {view && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }} onClick={() => setView(null)}>
          <div style={{ background:C.bg2, border:`0.5px solid rgba(124,109,250,0.4)`, borderRadius:14, padding:28, maxWidth:520, width:'100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'flex-start' }}>
              <div style={{ width:56, height:56, borderRadius:12, background:`${catColor(view.category)}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{view.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:800 }}>{view.name}</div>
                <div style={{ fontSize:12, color:catColor(view.category), marginTop:2 }}>{view.category}</div>
                <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>★ {view.rating} · {view.reviews} reviews</div>
              </div>
              <button onClick={() => setView(null)} style={{ background:'none', border:'none', color:C.text3, cursor:'pointer', fontSize:20 }}>✕</button>
            </div>
            <div style={{ fontSize:14, color:C.text2, lineHeight:1.8, marginBottom:16 }}>{view.desc}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
              {view.tags.map((t: string) => <Pill key={t} color={catColor(view.category)} bg={`${catColor(view.category)}18`}>{t}</Pill>)}
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:C.teal }}>+${view.price}/mo</div>
              {installed.has(view.id) ? (
                <Btn variant="danger" onClick={() => { setInstalled(p => { const n=new Set(p); n.delete(view.id); return n; }); setView(null); }}>Remove Agent</Btn>
              ) : (
                <Btn onClick={() => { setInstalled(p => new Set([...p, view.id])); setView(null); }}>Install Agent →</Btn>
              )}
              <Btn variant="ghost" onClick={() => setView(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
