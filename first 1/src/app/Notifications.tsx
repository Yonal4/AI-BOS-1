import { useEffect, useMemo, useState } from 'react'
import { C, AGENTS } from '../design'
import { Badge, Card, Spin } from '../components/ui'
import { AgentEvent, getTimelineEvents } from '../utils/collaboration'
import { useOrgId } from '../context/OrgContext'

const EVENT_FILTERS = [
  { id: 'all', label: 'All Events' },
  { id: 'marketing.campaign.created', label: 'Campaigns' },
  { id: 'marketing.lead.created', label: 'Leads' },
  { id: 'marketing.content.generated', label: 'Content' },
  { id: 'sales.lead.received', label: 'Sales Handoffs' },
  { id: 'sales.outreach.generated', label: 'Outreach' },
  { id: 'task.delegated', label: 'Delegations' },
]

const AGENT_COPY: Record<string, { name: string; color: string; emoji: string }> = {
  lexi: { name: 'Marketing Agent', color: C.coral, emoji: 'M' },
  aria: { name: 'Sales Agent', color: C.purple2, emoji: 'S' },
}

function eventTitle(event: AgentEvent) {
  const campaign = event.payload?.campaign
  const lead = event.payload?.lead
  const names: Record<string, string> = {
    'marketing.campaign.created': `Marketing Agent created campaign${campaign?.name ? `: ${campaign.name}` : ''}`,
    'marketing.lead.created': `Marketing Agent created lead${lead?.name ? `: ${lead.name}` : ''}`,
    'marketing.content.generated': `Marketing Agent generated ${event.payload?.type || 'content'}`,
    'sales.lead.received': `Sales Agent received lead${lead?.name ? `: ${lead.name}` : ''}`,
    'sales.outreach.generated': `Sales Agent generated outreach${event.entity_id ? ` for lead #${event.entity_id}` : ''}`,
    'lead.status.updated': `Lead status updated${event.payload?.to ? ` to ${event.payload.to}` : ''}`,
    'task.delegated': `${event.payload?.toAgent || 'Agent'} received delegated task`,
    'sales.outreach.failed': 'Sales Agent outreach generation failed',
  }
  return names[event.event_type] || event.event_type.replace(/\./g, ' ')
}

function eventBody(event: AgentEvent) {
  if (event.event_type === 'sales.outreach.generated') return event.payload?.outreach || 'Outreach generated and stored.'
  if (event.event_type === 'task.delegated') return `${event.agent_id} delegated ${event.payload?.taskType || 'a task'} to ${event.payload?.toAgent || 'another agent'}.`
  if (event.event_type === 'lead.status.updated') return `Lead moved from ${event.payload?.from || 'previous status'} to ${event.payload?.to || 'new status'}.`
  if (event.payload?.campaign?.audience) return `Audience: ${event.payload.campaign.audience}. Offer: ${event.payload.campaign.offer || 'not set'}.`
  if (event.payload?.lead?.company) return `${event.payload.lead.name} at ${event.payload.lead.company}.`
  if (event.payload?.error) return event.payload.error
  return `${event.entity_type || 'event'} ${event.entity_id || ''}`.trim()
}

function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function Notifications() {
  const orgId = useOrgId()
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [agentFilter, setAgentFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      getTimelineEvents({ agent: agentFilter, eventType: eventFilter, search, limit: 100 }, orgId)
        .then(setEvents)
        .catch((e: any) => setError(e.message))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [agentFilter, eventFilter, search, orgId])

  const counts = useMemo(() => {
    return events.reduce((acc: Record<string, number>, event) => {
      acc[event.agent_id] = (acc[event.agent_id] || 0) + 1
      return acc
    }, {})
  }, [events])

  return (
    <div style={{ height:'100%', overflow:'auto', padding:'20px', background:C.bg, boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>Agent Activity Timeline</div>
          <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Real events stored by organization scope · {orgId || 'default'}</div>
        </div>
        <Badge type={error ? 'danger' : 'info'}>{loading ? 'Loading' : `${events.length} events`}</Badge>
      </div>

      <Card style={{ marginBottom:14, padding:'12px 14px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 180px', gap:10, marginBottom:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, leads, campaigns, payload..."
            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}/>
          <select value={eventFilter} onChange={e=>setEventFilter(e.target.value)}
            style={{ padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:12, outline:'none' }}>
            {EVENT_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={()=>setAgentFilter('all')} style={{ padding:'6px 12px', borderRadius:20, border:`0.5px solid ${agentFilter==='all'?C.teal:C.border}`, background:agentFilter==='all'?'rgba(34,211,176,0.12)':'transparent', color:agentFilter==='all'?C.teal:C.text3, fontSize:11, cursor:'pointer' }}>
            All agents
          </button>
          {AGENTS.filter(a => ['lexi','aria'].includes(a.id)).map(a => (
            <button key={a.id} onClick={()=>setAgentFilter(a.id)} style={{ padding:'6px 12px', borderRadius:20, border:`0.5px solid ${agentFilter===a.id?a.color:C.border}`, background:agentFilter===a.id?a.bg:'transparent', color:agentFilter===a.id?a.color:C.text3, fontSize:11, cursor:'pointer' }}>
              {a.name} {counts[a.id] ? `(${counts[a.id]})` : ''}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card style={{ display:'flex', alignItems:'center', gap:10, color:C.text3 }}>
          <Spin size={14}/> Loading timeline events...
        </Card>
      )}

      {error && (
        <Card style={{ border:`0.5px solid rgba(240,106,64,0.25)`, background:'rgba(240,106,64,0.05)' }}>
          <div style={{ fontSize:13, color:C.coral, fontWeight:700, marginBottom:4 }}>Timeline unavailable</div>
          <div style={{ fontSize:12, color:C.text2 }}>{error}</div>
        </Card>
      )}

      {!loading && !error && events.length === 0 && (
        <Card style={{ textAlign:'center', padding:'44px' }}>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>No activity events yet</div>
          <div style={{ fontSize:13, color:C.text3 }}>Create a collaborative Marketing campaign to generate the first timeline.</div>
        </Card>
      )}

      {!loading && !error && events.length > 0 && (
        <div style={{ position:'relative', paddingLeft:18 }}>
          <div style={{ position:'absolute', left:5, top:4, bottom:4, width:1, background:C.border2 }}/>
          {events.map(event => {
            const agent = AGENT_COPY[event.agent_id] || { name: event.agent_role, color: C.text2, emoji: event.agent_id.slice(0,1).toUpperCase() }
            return (
              <div key={event.id} style={{ position:'relative', marginBottom:10 }}>
                <div style={{ position:'absolute', left:-18, top:16, width:11, height:11, borderRadius:'50%', background:agent.color, boxShadow:`0 0 0 4px ${C.bg}` }}/>
                <Card style={{ padding:'13px 15px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:`${agent.color}22`, color:agent.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>{agent.emoji}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700 }}>{eventTitle(event)}</div>
                        <div style={{ fontSize:10, color:C.text3 }}>{agent.name} · {event.event_type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:11, color:C.text3 }}>{timeAgo(event.created_at)}</div>
                      {event.workflow_id && <div style={{ fontSize:10, color:C.text3, marginTop:3 }}>{event.workflow_id}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.text2, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{eventBody(event)}</div>
                  <div style={{ display:'flex', gap:6, marginTop:9 }}>
                    {event.entity_type && <Badge>{event.entity_type}</Badge>}
                    {event.entity_id && <Badge type="info">#{event.entity_id}</Badge>}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
