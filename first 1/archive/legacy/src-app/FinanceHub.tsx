import { useState } from 'react'
import { C } from '../design'
import { Card, Btn, Badge, Spin, KpiGrid } from '../components/ui'
import { callAI } from '../utils/ai'

const FELIX_SYS = `You are Felix, AI Finance Analyst for AI BOS. Numbers first. Structure every response as: 📊 Summary → 🚦 Key Signals → 💡 Recommendation. Be specific with dollar amounts and percentages. AI BOS MRR: $47,200, costs ~$12,400/mo.`

const MRR_HISTORY = [
  { month:'Jan', mrr:18200, costs:8100, churn:1200 },
  { month:'Feb', mrr:22400, costs:8900, churn:1400 },
  { month:'Mar', mrr:27800, costs:9800, churn:980  },
  { month:'Apr', mrr:31200, costs:10200, churn:1800 },
  { month:'May', mrr:38100, costs:11400, churn:2100 },
  { month:'Jun', mrr:47200, costs:12400, churn:1600 },
]

const ALERTS = [
  { type:'warning', text:'API costs increased 18% this week — evaluate usage patterns', agent:'Felix' },
  { type:'success', text:'MRR grew 23.9% MoM — highest growth rate in 6 months', agent:'Felix' },
  { type:'danger',  text:'3 accounts 2+ weeks overdue — $4,800 at risk', agent:'Felix' },
]

export default function FinanceHub() {
  const [view, setView] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [question, setQuestion] = useState('')

  const askFelix = async (q: string) => {
    if (!q.trim() || loading) return
    setLoading(true); setAnalysis('')
    const ctx = `MRR: $47,200 | Costs: $12,400 | Net Margin: 73.7% | MoM Growth: 23.9% | Churn MRR: $1,600 | New MRR: $8,100 | Active customers: 23 | Overdue invoices: $4,800 | Top plans: 8×Team ($15,992), 11×Growth ($8,789), 4×Starter ($1,196)`
    try {
      const text = await callAI(FELIX_SYS, `Company data: ${ctx}\n\nQuestion: ${q}`, 700)
      setAnalysis(text)
    } catch(e: any) { setAnalysis(`Error: ${e.message}`) }
    setLoading(false)
  }

  const perc = (a: number, b: number) => `${((a/b)*100).toFixed(0)}%`
  const latest = MRR_HISTORY[MRR_HISTORY.length-1]
  const maxMrr = Math.max(...MRR_HISTORY.map(m => m.mrr))

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div><div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>💰 Finance Hub</div><div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Felix monitors revenue, flags risks, and builds forecasts</div></div>
        <div style={{ display:'flex', gap:8 }}>
          {['overview','revenue','expenses','forecast','felix'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'6px 14px', borderRadius:8, border:`0.5px solid ${view===v?C.gold:C.border}`, background:view===v?'rgba(250,204,75,0.12)':'transparent', color:view===v?C.gold:C.text3, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{v==='felix'?'💰 Ask Felix':v}</button>
          ))}
        </div>
      </div>

      <KpiGrid items={[
        { label:'MRR', value:'$47.2K', sub:'↑ 23.9% MoM', color:C.teal },
        { label:'Net Margin', value:'73.7%', sub:'Above target', color:C.gold },
        { label:'Churn MRR', value:'$1,600', sub:'3.4% churn rate', color:C.coral },
        { label:'ARR Run-rate', value:'$566K', sub:'Projected 12-mo', color:C.purple2 },
      ]}/>

      {view==='overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>MRR Growth</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120, marginBottom:12 }}>
              {MRR_HISTORY.map(m => (
                <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:9, color:C.teal, fontWeight:600 }}>${(m.mrr/1000).toFixed(0)}K</div>
                  <div style={{ width:'100%', background:C.teal, borderRadius:'3px 3px 0 0', height:`${(m.mrr/maxMrr)*90}px`, opacity:.8 }}/>
                  <div style={{ fontSize:9, color:C.text3 }}>{m.month}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:20 }}>
              {[{l:'New MRR',v:'$8,100',c:C.teal},{l:'Expansion',v:'$3,200',c:C.purple2},{l:'Churned',v:'-$1,600',c:C.coral},{l:'Net New',v:'$9,700',c:C.gold}].map(k => (
                <div key={k.l}><div style={{ fontSize:10, color:C.text3 }}>{k.l}</div><div style={{ fontSize:13, fontWeight:700, color:k.c }}>{k.v}</div></div>
              ))}
            </div>
          </Card>
          <div>
            {ALERTS.map((a,i) => (
              <div key={i} style={{ background:a.type==='danger'?'rgba(240,106,64,0.08)':a.type==='warning'?'rgba(250,204,75,0.08)':'rgba(74,222,128,0.08)', border:`0.5px solid ${a.type==='danger'?'rgba(240,106,64,0.3)':a.type==='warning'?'rgba(250,204,75,0.3)':'rgba(74,222,128,0.3)'}`, borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:600, color:a.type==='danger'?C.coral:a.type==='warning'?C.gold:C.green, marginBottom:3 }}>💰 Felix Alert</div>
                <div style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}>{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view==='revenue' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Revenue by Plan</div>
            {[{plan:'Team Plan — $1,999/mo',count:8,mrr:15992,perc:33.9},{plan:'Growth Plan — $799/mo',count:11,mrr:8789,perc:18.6},{plan:'Starter Plan — $299/mo',count:4,mrr:1196,perc:2.5}].map(r => (
              <div key={r.plan} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:500 }}>{r.plan}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.teal }}>${r.mrr.toLocaleString()}</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:6 }}>
                  <div style={{ height:'100%', width:`${r.perc*2.5}%`, background:C.grad, borderRadius:6 }}/>
                </div>
                <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{r.count} customers · {r.perc}% of MRR</div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Monthly Summary</div>
            {[{l:'Total MRR',v:'$47,200',c:C.teal},{l:'Total Costs',v:'$12,400',c:C.coral},{l:'Gross Profit',v:'$34,800',c:C.green},{l:'Gross Margin',v:'73.7%',c:C.gold},{l:'Customer Count',v:23,c:C.purple2},{l:'ARPU',v:'$2,052/mo',c:C.teal},{l:'LTV (avg)',v:'$24,624',c:C.purple2},{l:'CAC',v:'$840',c:C.text2}].map(s => (
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.text2 }}>{s.l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==='expenses' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Monthly Expenses — $12,400</div>
            {[{cat:'Claude API (Anthropic)',amt:4200,pct:33.9},{cat:'Infrastructure (Replit/Vercel)',amt:2800,pct:22.6},{cat:'Tools & Software',amt:1900,pct:15.3},{cat:'Marketing & Ads',amt:1800,pct:14.5},{cat:'Contractors',amt:1200,pct:9.7},{cat:'Legal & Admin',amt:500,pct:4.0}].map(e => (
              <div key={e.cat} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12 }}>{e.cat}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ fontSize:11, color:C.text3 }}>{e.pct}%</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.gold }}>${e.amt.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${e.pct}%`, background:C.coral, borderRadius:4, opacity:.7 }}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:C.gold }}>💰 Felix Recommendations</div>
            {['Negotiate Anthropic volume pricing — at $4,200/mo, eligible for 15% discount ($630/mo savings)','API usage spiked 18% — 2 agents over-querying. Nova can optimize prompts.','Move to annual billing for 3 remaining month-to-month accounts → +$2,400 upfront','Marketing spend ROI: $1,800 spend drove $11.3K attributed MRR. Increase budget 30%.'].map((r,i) => (
              <div key={i} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'flex-start' }}>
                <span style={{ color:C.gold, fontWeight:700, flexShrink:0 }}>→</span>
                <span style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}>{r}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==='forecast' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>12-Month MRR Forecast</div>
            {[{m:'Jul',base:55600,opt:62100},{m:'Aug',base:64900,opt:74500},{m:'Sep',base:74800,opt:89400},{m:'Oct',base:85500,opt:105200},{m:'Nov',base:97400,opt:122600},{m:'Dec',base:110200,opt:141800}].map(f => (
              <div key={f.m} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12 }}>{f.m} 2026</span>
                  <div style={{ display:'flex', gap:12 }}>
                    <span style={{ fontSize:11, color:C.teal }}>Base: ${(f.base/1000).toFixed(0)}K</span>
                    <span style={{ fontSize:11, color:C.purple2 }}>Opt: ${(f.opt/1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div style={{ position:'relative', height:6, background:'rgba(255,255,255,0.07)', borderRadius:6 }}>
                  <div style={{ position:'absolute', height:'100%', width:`${(f.base/141800)*100}%`, background:C.teal, borderRadius:6, opacity:.6 }}/>
                  <div style={{ position:'absolute', height:'100%', width:`${(f.opt/141800)*100}%`, background:C.purple2, borderRadius:6, opacity:.3 }}/>
                </div>
              </div>
            ))}
            <div style={{ fontSize:10, color:C.text3, display:'flex', gap:16, marginTop:8 }}>
              <span style={{ color:C.teal }}>■</span> Base case (20% MoM growth)
              <span style={{ color:C.purple2 }}>■</span> Optimistic (28% MoM growth)
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Key Metrics to Hit ARR $1M</div>
            {[{l:'Current ARR',v:'$566K',c:C.teal},{l:'ARR needed',v:'$1,000K',c:C.purple2},{l:'Gap',v:'$434K',c:C.coral},{l:'At 20% MoM growth',v:'~5 months',c:C.gold},{l:'New customers needed',v:'+18',c:C.text2},{l:'Required churn rate',v:'< 2.5%',c:C.text2}].map(m => (
              <div key={m.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.text2 }}>{m.l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:m.c }}>{m.v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==='felix' && (
        <div>
          <Card style={{ marginBottom:14, background:'rgba(250,204,75,0.05)', border:`0.5px solid rgba(250,204,75,0.3)` }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.gold, marginBottom:10 }}>💰 Ask Felix — AI Finance Analyst</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key==='Enter'&&askFelix(question)}
                placeholder="e.g. Should we raise prices? How do we hit $1M ARR faster?"
                style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}/>
              <Btn onClick={() => askFelix(question)} disabled={loading} style={{ background:C.gold, border:'none' }}>
                {loading?<Spin size={12}/>:'Ask →'}
              </Btn>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Should we raise prices?','What are our biggest risks?','How to hit $1M ARR?','Reduce churn — what\'s our plan?','What\'s our burn rate?'].map(q => (
                <button key={q} onClick={() => askFelix(q)} style={{ padding:'4px 10px', background:'rgba(250,204,75,0.1)', border:`0.5px solid rgba(250,204,75,0.25)`, borderRadius:20, color:C.gold, fontSize:11, cursor:'pointer' }}>{q}</button>
              ))}
            </div>
          </Card>
          {analysis && (
            <Card style={{ background:'rgba(250,204,75,0.04)', border:`0.5px solid rgba(250,204,75,0.25)` }}>
              <div style={{ fontSize:11, color:C.gold, fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>💰 Felix's Analysis</div>
              <div style={{ fontSize:14, lineHeight:1.9, color:C.text, whiteSpace:'pre-wrap' }}>{analysis}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
