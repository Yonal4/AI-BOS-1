import { useCallback, useEffect, useMemo, useState } from 'react'
import { C } from '../design'
import { AgentTask, getAgentTasks } from '../utils/collaboration'
import { useOrgId } from '../context/OrgContext'
import { Badge, Btn, Card, KpiGrid, Spin } from '../components/ui'

const STAGES = ['New', 'Qualified', 'Contacted', 'Proposal Sent', 'Won', 'Lost'] as const
type Stage = typeof STAGES[number]

type Lead = {
  id: number
  name: string
  email: string | null
  company: string | null
  source: string
  status: Stage
  notes: string | null
  assigned_agent: string
  value: number
  score: number
  created_at: string
  updated_at: string
}

type Stats = {
  total: number
  new_count: number
  qualified: number
  contacted: number
  proposal_sent: number
  won: number
  lost: number
  pipeline_value: number
  won_value: number
  avg_score: number
}

function money(value: number) {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`
}

function timeLabel(value: string) {
  return new Date(value).toLocaleString()
}

function statusBadge(status: string) {
  const type = status === 'Won' ? 'success' : status === 'Lost' ? 'danger' : status === 'Contacted' ? 'warning' : 'info'
  return <Badge type={type}>{status}</Badge>
}

export default function SalesHub() {
  const orgId = useOrgId()
  const [view, setView] = useState<'leads' | 'tasks'>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<'All' | Stage>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orgHeaders = useMemo(() => orgId ? { 'x-org-id': orgId } : {}, [orgId])

  const api = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`/api/leads${path}`, {
      ...opts,
      headers: { ...orgHeaders, ...(opts.headers as Record<string, string> || {}) }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Lead request failed')
    return data
  }, [orgHeaders])

  const load = useCallback(async () => {
    setError('')
    try {
      const [leadData, statData, taskData] = await Promise.all([
        api('/'),
        api('/stats'),
        getAgentTasks('sales', orgId)
      ])
      setLeads(leadData.leads || [])
      setStats(statData)
      setTasks(taskData || [])
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [api, orgId])

  useEffect(() => { load() }, [load])

  const filtered = leads.filter(lead => {
    const q = search.toLowerCase()
    const matchesSearch = !q || lead.name.toLowerCase().includes(q) || (lead.company || '').toLowerCase().includes(q) || (lead.email || '').toLowerCase().includes(q)
    const matchesStage = stage === 'All' || lead.status === stage
    return matchesSearch && matchesStage
  })

  const updateLeadStatus = async (lead: Lead, status: Stage) => {
    setError('')
    try {
      await api(`/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Sales Agent</div>
            <div style={{ fontSize: 12, color: C.text3, marginTop: 1 }}>Aria receives Marketing leads, stores outreach, and updates lead status.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['leads', 'tasks'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab)} style={{ padding: '6px 14px', borderRadius: 8, border: `0.5px solid ${view === tab ? C.purple : C.border}`, background: view === tab ? 'rgba(124,109,250,0.12)' : 'transparent', color: view === tab ? C.purple2 : C.text3, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
            ))}
            <Btn variant="ghost" onClick={load}>Refresh</Btn>
          </div>
        </div>

        <KpiGrid items={[
          { label: 'Leads Generated', value: loading ? '-' : leads.length, color: C.purple2 },
          { label: 'Leads Contacted', value: loading ? '-' : (stats?.contacted || 0), color: C.gold },
          { label: 'Outreach Generated', value: loading ? '-' : tasks.filter(task => task.task_type === 'generate_outreach' && task.status === 'completed').length, color: C.teal },
          { label: 'Pipeline Value', value: loading ? '-' : money(stats?.pipeline_value || 0), color: C.green },
        ]} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {error && <Card style={{ marginBottom: 12, border: `0.5px solid rgba(240,106,64,0.35)`, color: C.coral }}>{error}</Card>}
        {loading ? (
          <Card><div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.text3 }}><Spin /> Loading sales data...</div></Card>
        ) : view === 'leads' ? (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search leads"
                style={{ flex: 1, maxWidth: 320, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none' }}
              />
              <select
                value={stage}
                onChange={event => setStage(event.target.value as any)}
                style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 12, outline: 'none' }}
              >
                <option value="All">All stages</option>
                {STAGES.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 1fr 1.2fr', padding: '10px 16px', borderBottom: `0.5px solid ${C.border}`, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                <div>Lead</div><div>Company</div><div>Source</div><div>Status</div><div>Value</div><div>Updated</div>
              </div>
              {filtered.length === 0 && <div style={{ padding: 36, textAlign: 'center', color: C.text3, fontSize: 13 }}>No real leads found for this organization.</div>}
              {filtered.map((lead, index) => (
                <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 1fr 1.2fr', padding: '12px 16px', borderBottom: index < filtered.length - 1 ? `0.5px solid ${C.border}` : 'none', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{lead.email || 'No email'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2 }}>{lead.company || '-'}</div>
                  <div style={{ fontSize: 12, color: C.text3 }}>{lead.source}</div>
                  <div>
                    <select
                      value={lead.status}
                      onChange={event => updateLeadStatus(lead, event.target.value as Stage)}
                      style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 7, color: C.text, fontSize: 12, outline: 'none' }}
                    >
                      {STAGES.map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: 13, color: C.teal, fontWeight: 700 }}>{money(lead.value || 0)}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{timeLabel(lead.updated_at)}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.length === 0 && <Card style={{ color: C.text3, fontSize: 13 }}>No delegated Sales tasks yet. Create a Marketing campaign to generate a lead and Sales outreach.</Card>}
            {tasks.map(task => (
              <Card key={task.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{task.task_type.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>From {task.from_agent} / Workflow {task.workflow_id}</div>
                    {task.result?.outreach && (
                      <div style={{ marginTop: 10, padding: 12, background: C.bg3, border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {task.result.outreach}
                      </div>
                    )}
                    {task.result?.error && <div style={{ marginTop: 8, fontSize: 12, color: C.coral }}>{task.result.error}</div>}
                  </div>
                  {task.status === 'completed' ? <Badge type="success">completed</Badge> : task.status === 'failed' ? <Badge type="danger">failed</Badge> : <Badge type="warning">{task.status}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
