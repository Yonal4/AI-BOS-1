import { useState } from 'react'
import { C } from '../design'
import { Card, Btn, Badge, Pill } from '../components/ui'

const API_KEY = 'aibos_live_sk_7f3b2c9d8e1a4f6b5c2d9e8f1a3b4c5d'
const WH_KEY  = 'whsec_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d'

export default function Developer() {
  const [view, setView] = useState('api')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<string|null>(null)

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const ENDPOINTS = [
    { method:'POST', path:'/api/v1/agents/execute',      desc:'Execute a task on a specific agent',       auth:true  },
    { method:'GET',  path:'/api/v1/agents/status',       desc:'Get status of all active agents',          auth:true  },
    { method:'POST', path:'/api/v1/brain/query',         desc:'Query the Company Brain RAG system',       auth:true  },
    { method:'POST', path:'/api/v1/brain/ingest',        desc:'Add document to Company Brain',            auth:true  },
    { method:'GET',  path:'/api/v1/conversations',       desc:'List all agent conversation history',      auth:true  },
    { method:'POST', path:'/api/v1/command',             desc:'Send a goal to Command Center',            auth:true  },
    { method:'GET',  path:'/api/v1/analytics',           desc:'Get performance metrics for all agents',   auth:true  },
    { method:'POST', path:'/api/v1/webhooks',            desc:'Register a webhook endpoint',              auth:true  },
  ]

  const methodColor = (m: string) => ({ GET:C.teal, POST:C.purple2, PUT:C.gold, DELETE:C.coral }[m] || C.text2)

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>🛠️ Developer Platform</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>API, webhooks, and integrations for builders</div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['api','endpoints','webhooks','logs'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding:'6px 14px', borderRadius:8, border:`0.5px solid ${view===v?C.purple:C.border}`, background:view===v?'rgba(124,109,250,0.12)':'transparent', color:view===v?C.purple2:C.text3, fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>{v==='api'?'API Keys':v==='endpoints'?'Endpoints':v==='webhooks'?'Webhooks':'Logs'}</button>
        ))}
      </div>

      {view==='api' && (
        <div>
          <Card style={{ marginBottom:14, background:'rgba(124,109,250,0.04)', border:`0.5px solid rgba(124,109,250,0.25)` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>Live API Key</div>
                <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>Use this key to authenticate all API requests</div>
              </div>
              <Badge type="success">Active</Badge>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, padding:'10px 14px', background:C.bg3, border:`0.5px solid ${C.border2}`, borderRadius:8, fontFamily:'monospace', fontSize:12, color:C.text2 }}>
                {showKey ? API_KEY : API_KEY.slice(0,12) + '••••••••••••••••••••••••••••••••'}
              </div>
              <Btn variant="ghost" onClick={() => setShowKey(p => !p)} style={{ fontSize:11 }}>{showKey?'Hide':'Show'}</Btn>
              <Btn variant="ghost" onClick={() => copy(API_KEY,'apikey')} style={{ fontSize:11 }}>{copied==='apikey'?'✓ Copied':'Copy'}</Btn>
            </div>
          </Card>

          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Quickstart</div>
            <div style={{ fontSize:11, color:C.text3, marginBottom:6 }}>Execute a task on Aria:</div>
            <div style={{ background:C.bg, borderRadius:8, padding:'14px 16px', fontFamily:'monospace', fontSize:12, color:'#a594ff', lineHeight:1.8, marginBottom:10 }}>
              <span style={{ color:C.text3 }}>// Execute a task via AI BOS API</span>{'\n'}
              <span style={{ color:C.teal }}>const</span> res = <span style={{ color:C.teal }}>await</span> <span style={{ color:'#f0f0f8' }}>fetch</span>(<span style={{ color:'#4ade80' }}>'/api/v1/agents/execute'</span>, {'{'}{'\n'}
              {'  '}<span style={{ color:'#f0f0f8' }}>method</span>: <span style={{ color:'#4ade80' }}>'POST'</span>,{'\n'}
              {'  '}<span style={{ color:'#f0f0f8' }}>headers</span>: {'{'}
              <span style={{ color:'#f0f0f8' }}> 'Authorization'</span>: <span style={{ color:'#4ade80' }}>`Bearer {API_KEY.slice(0,18)}…`</span> {'}'},{'\n'}
              {'  '}<span style={{ color:'#f0f0f8' }}>body</span>: <span style={{ color:'#f0f0f8' }}>JSON.stringify</span>({'{'}<span style={{ color:'#f0f0f8' }}>agent</span>: <span style={{ color:'#4ade80' }}>'aria'</span>, <span style={{ color:'#f0f0f8' }}>task</span>: <span style={{ color:'#4ade80' }}>'Draft email to {'{'}lead{'}'}'</span>{'}'}){')'}{'\n'}
              {'}'})
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn variant="ghost" style={{ fontSize:11 }}>View Full Docs</Btn>
              <Btn variant="ghost" style={{ fontSize:11 }}>OpenAPI Spec</Btn>
              <Btn variant="ghost" onClick={() => copy(`Bearer ${API_KEY}`, 'bearer')} style={{ fontSize:11 }}>{copied==='bearer'?'✓ Copied':'Copy Auth Header'}</Btn>
            </div>
          </Card>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Card>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Usage Stats</div>
              {[{l:'API calls this month',v:'4,280',c:C.purple2},{l:'Avg response time',v:'312ms',c:C.teal},{l:'Success rate',v:'99.7%',c:C.green},{l:'Rate limit',v:'1,000/min',c:C.text2}].map(s => (
                <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
                  <span style={{ fontSize:12, color:C.text2 }}>{s.l}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:s.c }}>{s.v}</span>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>SDK Libraries</div>
              {[{l:'Node.js / TypeScript',pkg:'aibos-sdk',v:'1.4.2'},{l:'Python',pkg:'aibos-py',v:'1.3.1'},{l:'Go',pkg:'aibos-go',v:'1.1.0'},{l:'REST (via cURL)',pkg:'—',v:'v1'}].map(sdk => (
                <div key={sdk.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <div><div style={{ fontSize:12 }}>{sdk.l}</div><div style={{ fontSize:10, color:C.text3 }}>{sdk.pkg}</div></div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Pill color={C.teal} bg="rgba(34,211,176,0.1)" style={{ fontSize:10 }}>v{sdk.v}</Pill>
                    <button style={{ fontSize:10, color:C.purple2, background:'none', border:'none', cursor:'pointer' }}>npm install →</button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {view==='endpoints' && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>REST API Endpoints</div>
          {ENDPOINTS.map((ep,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:methodColor(ep.method), minWidth:40, fontFamily:'monospace' }}>{ep.method}</span>
              <code style={{ flex:1, fontSize:12, color:C.purple2, fontFamily:'monospace' }}>{ep.path}</code>
              <span style={{ fontSize:12, color:C.text2, flex:1 }}>{ep.desc}</span>
              {ep.auth && <Pill color={C.teal} bg="rgba(34,211,176,0.1)" style={{ fontSize:10 }}>Auth</Pill>}
              <button style={{ fontSize:11, color:C.text3, background:'none', border:'none', cursor:'pointer' }}>Docs →</button>
            </div>
          ))}
        </Card>
      )}

      {view==='webhooks' && (
        <div>
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Webhook Signing Secret</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <div style={{ flex:1, padding:'10px 14px', background:C.bg3, border:`0.5px solid ${C.border2}`, borderRadius:8, fontFamily:'monospace', fontSize:12, color:C.text2 }}>
                {WH_KEY.slice(0,12)}••••••••••••••••••••••
              </div>
              <Btn variant="ghost" onClick={() => copy(WH_KEY,'webhook')} style={{ fontSize:11 }}>{copied==='webhook'?'✓ Copied':'Copy'}</Btn>
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Webhook Events</div>
            {['agent.task.completed','agent.task.failed','lead.created','lead.stage_changed','deal.closed','ticket.created','ticket.resolved','approval.requested','mrr.updated','churn.risk.detected'].map((ev,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                <code style={{ fontSize:12, color:C.purple2, fontFamily:'monospace' }}>{ev}</code>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:C.teal, marginTop:2 }}/>
                  <span style={{ fontSize:11, color:C.teal }}>Enabled</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view==='logs' && (
        <Card>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>API Request Logs</div>
          <div style={{ fontFamily:'monospace', fontSize:11, lineHeight:1.8, color:C.text2 }}>
            {[
              { time:'06:14:32', status:200, method:'POST', path:'/api/v1/agents/execute', agent:'aria',   ms:284  },
              { time:'06:14:18', status:200, method:'GET',  path:'/api/v1/agents/status',  agent:null,     ms:41   },
              { time:'06:13:55', status:200, method:'POST', path:'/api/v1/brain/query',    agent:null,     ms:612  },
              { time:'06:12:10', status:401, method:'POST', path:'/api/v1/agents/execute', agent:null,     ms:12   },
              { time:'06:11:49', status:200, method:'POST', path:'/api/v1/command',        agent:null,     ms:1240 },
            ].map((log,i) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'4px 0', borderBottom:`0.5px solid ${C.border}` }}>
                <span style={{ color:C.text3, minWidth:60 }}>{log.time}</span>
                <span style={{ color:log.status===200?C.teal:C.coral, minWidth:28, fontWeight:700 }}>{log.status}</span>
                <span style={{ color:methodColor(log.method), minWidth:35 }}>{log.method}</span>
                <span style={{ color:C.purple2, flex:1 }}>{log.path}</span>
                <span style={{ color:C.text3, minWidth:50, textAlign:'right' }}>{log.ms}ms</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
