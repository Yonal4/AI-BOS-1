import { useState } from 'react'
import { C } from '../design'
import { Card, Btn, Badge, Pill } from '../components/ui'

const INTEGRATIONS = [
  { id:'gmail',       name:'Gmail',         emoji:'📧', category:'Communication', desc:'Send emails, read inbox, manage labels', status:'connected', lastSync:'2m ago' },
  { id:'gcal',        name:'Google Calendar',emoji:'📅', category:'Scheduling',   desc:'Book meetings, check availability, send invites', status:'connected', lastSync:'5m ago' },
  { id:'slack',       name:'Slack',          emoji:'💬', category:'Communication', desc:'Send messages, post updates, create channels', status:'connected', lastSync:'1m ago' },
  { id:'hubspot',     name:'HubSpot',        emoji:'🟠', category:'CRM',          desc:'Sync leads, deals, contacts, and activities', status:'connected', lastSync:'10m ago' },
  { id:'stripe',      name:'Stripe',         emoji:'💳', category:'Payments',     desc:'Track revenue, subscriptions, invoices, disputes', status:'connected', lastSync:'15m ago' },
  { id:'notion',      name:'Notion',         emoji:'📝', category:'Knowledge',    desc:'Read/write pages, databases, and company docs', status:'disconnected', lastSync:null },
  { id:'whatsapp',    name:'WhatsApp Business',emoji:'💚', category:'Communication', desc:'Send messages, manage broadcasts, auto-reply', status:'disconnected', lastSync:null },
  { id:'salesforce',  name:'Salesforce',     emoji:'☁️', category:'CRM',          desc:'Full CRM sync: leads, opportunities, accounts', status:'disconnected', lastSync:null },
  { id:'shopify',     name:'Shopify',        emoji:'🛍️', category:'E-Commerce',   desc:'Orders, inventory, customers, abandoned carts', status:'disconnected', lastSync:null },
  { id:'zapier',      name:'Zapier',         emoji:'⚡', category:'Automation',   desc:'Connect to 5,000+ apps via Zapier webhooks', status:'disconnected', lastSync:null },
  { id:'linkedin',    name:'LinkedIn',       emoji:'🔵', category:'Social',       desc:'Publish posts, connect with leads, InMail', status:'connected', lastSync:'30m ago' },
  { id:'gdrive',      name:'Google Drive',   emoji:'📁', category:'Storage',      desc:'Read/write files, create docs, manage folders', status:'disconnected', lastSync:null },
  { id:'intercom',    name:'Intercom',       emoji:'💬', category:'Support',      desc:'Sync conversations, contacts, and support tickets', status:'disconnected', lastSync:null },
  { id:'quickbooks',  name:'QuickBooks',     emoji:'🟢', category:'Finance',      desc:'Invoices, expenses, P&L, tax reports', status:'disconnected', lastSync:null },
]

const CATEGORIES = ['All','Communication','CRM','Payments','Scheduling','Knowledge','Social','Finance','Storage','E-Commerce','Automation','Support']

export default function Integrations() {
  const [connections, setConnections] = useState(new Set(INTEGRATIONS.filter(i => i.status==='connected').map(i => i.id)))
  const [cat, setCat] = useState('All')
  const [connecting, setConnecting] = useState<string|null>(null)

  const filtered = INTEGRATIONS.filter(i => cat==='All'||i.category===cat)

  const connect = async (id: string) => {
    setConnecting(id)
    await new Promise(r => setTimeout(r, 1400))
    setConnections(p => new Set([...p, id]))
    setConnecting(null)
  }

  const disconnect = (id: string) => {
    setConnections(p => { const n=new Set(p); n.delete(id); return n; })
  }

  const catColors: Record<string,string> = { Communication:C.teal, CRM:'#7c6dfa', Payments:C.green, Scheduling:C.purple2, Knowledge:C.gold, Social:'#1da1f2', Finance:C.gold, Storage:C.text2, 'E-Commerce':'#96bf48', Automation:C.coral, Support:C.teal }

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>🔌 Integrations</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Connect your tools so AI agents can take action across your stack</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[{l:'Connected',v:connections.size,c:C.teal},{l:'Available',v:INTEGRATIONS.length,c:C.purple2},{l:'Actions/day',v:'847',c:C.gold},{l:'Errors today',v:0,c:C.green}].map(k => (
          <Card key={k.l} style={{ padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.text3, marginBottom:3 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:'5px 12px', borderRadius:20, border:`0.5px solid ${cat===c?C.purple:C.border}`, background:cat===c?'rgba(124,109,250,0.12)':'transparent', color:cat===c?C.purple2:C.text3, fontSize:11, cursor:'pointer' }}>{c}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
        {filtered.map(int => {
          const isConnected = connections.has(int.id)
          const isConnecting = connecting===int.id
          const color = catColors[int.category] || C.text2
          return (
            <Card key={int.id} style={{ border:`0.5px solid ${isConnected?color+'30':C.border}`, background:isConnected?`${color}04`:C.bg2 }}>
              <div style={{ display:'flex', gap:10, marginBottom:8 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{int.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{int.name}</div>
                  <Pill color={color} bg={`${color}15`} style={{ fontSize:10, marginTop:2 }}>{int.category}</Pill>
                </div>
                {isConnected && <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:6, height:6, borderRadius:'50%', background:C.teal }}/><span style={{ fontSize:10, color:C.teal }}>Live</span></div>}
              </div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.5, marginBottom:8 }}>{int.desc}</div>
              {isConnected && int.lastSync && (
                <div style={{ fontSize:10, color:C.text3, marginBottom:8 }}>Last sync: {int.lastSync}</div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                {isConnected ? (
                  <>
                    <Btn variant="ghost" style={{ flex:1, fontSize:11, padding:'5px' }}>View Activity</Btn>
                    <Btn variant="danger" onClick={() => disconnect(int.id)} style={{ fontSize:11, padding:'5px 10px' }}>Disconnect</Btn>
                  </>
                ) : (
                  <button onClick={() => connect(int.id)} disabled={isConnecting} style={{ flex:1, padding:'8px', background:`${color}15`, border:`0.5px solid ${color}30`, borderRadius:7, color, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {isConnecting ? <>
                      <span style={{ width:11, height:11, border:'2px solid rgba(255,255,255,0.2)', borderTopColor:color, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Connecting…
                    </> : `+ Connect ${int.name}`}
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
