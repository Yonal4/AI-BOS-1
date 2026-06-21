import { useEffect, useState } from 'react'
import { C, AGENTS } from '../design'
import { Badge, Btn, Card, Spin } from '../components/ui'
import { DashboardAnalytics, getDashboardAnalytics } from '../utils/analytics'
import { useOrgId } from '../context/OrgContext'

const emptyAnalytics: DashboardAnalytics = {
  orgId: 'default',
  totals: {
    leadsGenerated: 0,
    leadsContacted: 0,
    agentActivity: 0,
    documentsUploaded: 0,
    readyDocuments: 0,
    brainSearches: 0,
  },
  campaignPerformance: {
    activeCampaigns: 0,
    totalCampaigns: 0,
    campaignLeads: 0,
    leadConversionRate: 0,
    recentCampaigns: [],
  },
  agentActivity: {
    totalEvents: 0,
    byAgent: [],
    recentEvents: [],
  },
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString()
}

function ago(iso?: string) {
  if (!iso) return 'No activity'
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function eventLabel(event: any) {
  return ({
    'marketing.campaign.created': 'Marketing Agent created campaign',
    'marketing.lead.created': 'Marketing Agent created lead',
    'sales.lead.received': 'Sales Agent received lead',
    'sales.outreach.generated': 'Sales Agent generated outreach',
    'lead.status.updated': 'Lead status updated',
    'marketing.content.generated': 'Marketing Agent generated content',
    'task.delegated': 'Task delegated',
  }[event.event_type] || String(event.event_type || 'Agent event').replace(/\./g, ' '))
}

export default function Dashboard({ onNavigate, ownerMode = false }: { onNavigate: (v:string)=>void, ownerMode?: boolean }) {
  const orgId = useOrgId()
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getDashboardAnalytics(orgId)
      .then(setAnalytics)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false))
  }, [orgId])

  const kpis = [
    { label:'Leads Generated', value:analytics.totals.leadsGenerated, color:C.purple2 },
    { label:'Leads Contacted', value:analytics.totals.leadsContacted, color:C.teal },
    { label:'Agent Activity', value:analytics.totals.agentActivity, color:C.gold },
    { label:'Documents Uploaded', value:analytics.totals.documentsUploaded, color:C.coral },
    { label:'Brain Searches', value:analytics.totals.brainSearches, color:C.green },
  ]

  return (
    <div style={{ height:'100%', overflow:'auto', padding:'20px', background:C.bg, boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:-.5 }}>{ownerMode ? 'Owner Dashboard' : 'Dashboard'}</div>
          <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Real analytics from database · {analytics.orgId || orgId || 'default'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {loading && <Badge type="info">Loading</Badge>}
          {error && <Badge type="danger">Analytics unavailable</Badge>}
          <Btn variant="ghost" onClick={() => onNavigate('timeline')} style={{ fontSize:12 }}>Timeline</Btn>
        </div>
      </div>

      {error && (
        <Card style={{ marginBottom:16, border:`0.5px solid rgba(240,106,64,0.25)`, background:'rgba(240,106,64,0.05)' }}>
          <div style={{ fontSize:13, color:C.coral, fontWeight:700, marginBottom:4 }}>Dashboard analytics could not load</div>
          <div style={{ fontSize:12, color:C.text2 }}>{error}</div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:C.text3, letterSpacing:.5, marginBottom:4 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:-1, color:k.color }}>{loading ? <Spin color={k.color}/> : fmt(k.value)}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16 }}>
        <div>
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Campaign Performance</div>
              <Badge type="info">{fmt(analytics.campaignPerformance.activeCampaigns)} active</Badge>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
              {[
                { label:'Total Campaigns', value:analytics.campaignPerformance.totalCampaigns, color:C.coral },
                { label:'Campaign Leads', value:analytics.campaignPerformance.campaignLeads, color:C.purple2 },
                { label:'Lead Conversion', value:`${analytics.campaignPerformance.leadConversionRate}%`, color:C.teal },
              ].map(item => (
                <div key={item.label} style={{ background:C.bg3, border:`0.5px solid ${C.border}`, borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:C.text3, marginBottom:4 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:item.color }}>{loading ? '...' : item.value}</div>
                </div>
              ))}
            </div>
            {analytics.campaignPerformance.recentCampaigns.length === 0 ? (
              <div style={{ fontSize:12, color:C.text3 }}>No campaigns in the database yet.</div>
            ) : analytics.campaignPerformance.recentCampaigns.map((campaign: any) => (
              <div key={campaign.id} style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px', gap:10, padding:'10px 0', borderTop:`0.5px solid ${C.border}`, alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{campaign.name}</div>
                  <div style={{ fontSize:11, color:C.text3 }}>{campaign.channel} · {campaign.audience}</div>
                </div>
                <Badge type={campaign.status === 'active' ? 'success' : 'default'}>{campaign.status}</Badge>
                <div style={{ fontSize:11, color:campaign.lead_id ? C.teal : C.text3, textAlign:'right' }}>{campaign.lead_id ? 'Lead created' : 'No lead'}</div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Agent Activity</div>
            {analytics.agentActivity.byAgent.length === 0 ? (
              <div style={{ fontSize:12, color:C.text3 }}>No agent events recorded yet.</div>
            ) : analytics.agentActivity.byAgent.map(row => {
              const agent = AGENTS.find(a => a.id === row.agent_id)
              return (
                <div key={row.agent_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderTop:`0.5px solid ${C.border}` }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:agent?.bg || C.bg3, color:agent?.color || C.text2, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{(agent?.name || row.agent_id).slice(0,1)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:agent?.color || C.text }}>{agent?.name || row.agent_id}</div>
                    <div style={{ fontSize:11, color:C.text3 }}>{row.agent_role} · last active {ago(row.last_activity)}</div>
                  </div>
                  <div style={{ fontSize:16, fontWeight:800, color:agent?.color || C.text }}>{fmt(row.event_count)}</div>
                </div>
              )
            })}
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Company Brain</div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`0.5px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.text2 }}>Documents uploaded</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.coral }}>{fmt(analytics.totals.documentsUploaded)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:`0.5px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.text2 }}>Ready documents</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.teal }}>{fmt(analytics.totals.readyDocuments)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0' }}>
              <span style={{ fontSize:12, color:C.text2 }}>Brain searches</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.green }}>{fmt(analytics.totals.brainSearches)}</span>
            </div>
          </Card>

          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Recent Events</div>
              <button onClick={() => onNavigate('timeline')} style={{ background:'transparent', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text3, fontSize:10, padding:'4px 8px', cursor:'pointer' }}>Open timeline</button>
            </div>
            {analytics.agentActivity.recentEvents.length === 0 ? (
              <div style={{ fontSize:12, color:C.text3, lineHeight:1.6 }}>No stored events yet.</div>
            ) : analytics.agentActivity.recentEvents.map((event: any) => {
              const agent = AGENTS.find(a => a.id === event.agent_id)
              return (
                <div key={event.id} style={{ display:'flex', gap:10, padding:'10px 0', borderTop:`0.5px solid ${C.border}` }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:`${agent?.color || C.text3}20`, color:agent?.color || C.text3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>{(agent?.name || event.agent_id).slice(0,1)}</div>
                  <div>
                    <div style={{ fontSize:12, color:C.text2, lineHeight:1.5 }}><span style={{ fontWeight:700, color:agent?.color || C.text2 }}>{agent?.name || event.agent_id}</span> {eventLabel(event)}</div>
                    <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{ago(event.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      </div>
    </div>
  )
}
