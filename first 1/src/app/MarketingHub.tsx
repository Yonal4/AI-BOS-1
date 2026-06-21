import { useCallback, useEffect, useState } from 'react'
import { C } from '../design'
import { Badge, Btn, Card, KpiGrid, Spin } from '../components/ui'
import { createCollaborativeCampaign, collaborationApi, AgentEvent } from '../utils/collaboration'
import { useOrgId } from '../context/OrgContext'

type Campaign = {
  id: number
  workflow_id: string
  name: string
  channel: string
  audience: string
  offer: string
  status: string
  lead_id: string | null
  created_at: string
}

type MarketingOutput = {
  id: number
  output_type: string
  prompt: string
  output: string
  status: string
  created_at: string
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString()
}

export default function MarketingHub() {
  const orgId = useOrgId()
  const [view, setView] = useState<'campaigns' | 'content' | 'history'>('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [content, setContent] = useState<MarketingOutput[]>([])
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCampaign, setShowCampaign] = useState(false)
  const [startingWorkflow, setStartingWorkflow] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [contentType, setContentType] = useState('linkedin')
  const [prompt, setPrompt] = useState('')
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    channel: 'Email',
    audience: '',
    offer: '',
    leadName: '',
    leadEmail: '',
    leadCompany: '',
    leadNotes: '',
    value: 799,
    score: 75,
  })

  const load = useCallback(async () => {
    setError('')
    try {
      const overview = await collaborationApi('/', {}, orgId)
      setCampaigns(overview.campaigns || [])
      setContent(overview.content || [])
      setEvents((overview.events || []).filter((event: AgentEvent) => event.agent_role === 'marketing'))
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [orgId])

  useEffect(() => { load() }, [load])

  const updateCampaignField = (key: keyof typeof campaignForm, value: string | number) => {
    setCampaignForm(prev => ({ ...prev, [key]: value }))
  }

  const campaignField = (key: keyof typeof campaignForm, label: string, type = 'text') => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      {key === 'leadNotes' ? (
        <textarea
          value={String(campaignForm[key])}
          onChange={event => updateCampaignField(key, event.target.value)}
          rows={3}
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 7, color: C.text, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
      ) : key === 'channel' ? (
        <select
          value={String(campaignForm[key])}
          onChange={event => updateCampaignField(key, event.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 7, color: C.text, fontSize: 12, outline: 'none' }}
        >
          {['Email', 'LinkedIn', 'Paid Ads', 'Webinar', 'Content'].map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={String(campaignForm[key])}
          onChange={event => updateCampaignField(key, type === 'number' ? Number(event.target.value) : event.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 7, color: C.text, fontSize: 12, outline: 'none' }}
        />
      )}
    </div>
  )

  const startCollaborativeCampaign = async () => {
    setStartingWorkflow(true)
    setError('')
    try {
      await createCollaborativeCampaign(campaignForm, orgId)
      setShowCampaign(false)
      setCampaignForm(prev => ({ ...prev, name: '', audience: '', offer: '', leadName: '', leadEmail: '', leadCompany: '', leadNotes: '' }))
      await load()
    } catch (e: any) {
      setError(e.message)
    }
    setStartingWorkflow(false)
  }

  const generateContent = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError('')
    try {
      await collaborationApi('/marketing-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType, prompt })
      }, orgId)
      setPrompt('')
      await load()
    } catch (e: any) {
      setError(e.message)
    }
    setGenerating(false)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 20, background: C.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Marketing Agent</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Lexi creates campaigns, content, leads, and Sales handoffs from persisted workflows.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['campaigns', 'content', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setView(tab)} style={{ padding: '6px 14px', borderRadius: 8, border: `0.5px solid ${view === tab ? C.coral : C.border}`, background: view === tab ? 'rgba(240,106,64,0.12)' : 'transparent', color: view === tab ? C.coral : C.text3, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
          ))}
          <Btn onClick={() => setShowCampaign(true)} style={{ background: C.coral }}>New Campaign</Btn>
        </div>
      </div>

      <KpiGrid items={[
        { label: 'Campaigns Created', value: loading ? '-' : campaigns.length, color: C.coral },
        { label: 'Leads Generated', value: loading ? '-' : campaigns.filter(campaign => campaign.lead_id).length, color: C.teal },
        { label: 'Content Outputs', value: loading ? '-' : content.length, color: C.purple2 },
        { label: 'Marketing Events', value: loading ? '-' : events.length, color: C.gold },
      ]} />

      {error && <Card style={{ marginBottom: 12, border: `0.5px solid rgba(240,106,64,0.35)`, color: C.coral }}>{error}</Card>}

      {loading ? (
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text3 }}><Spin /> Loading marketing data...</div></Card>
      ) : view === 'campaigns' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.length === 0 && <Card style={{ color: C.text3, fontSize: 13 }}>No campaigns yet. Create one to trigger the Marketing to Sales workflow.</Card>}
          {campaigns.map(campaign => (
            <Card key={campaign.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{campaign.name}</span>
                    <Badge type={campaign.status === 'active' ? 'success' : 'default'}>{campaign.status}</Badge>
                    <span style={{ fontSize: 11, color: C.text3 }}>{campaign.channel}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{campaign.audience}</div>
                  <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.6 }}>Offer: {campaign.offer}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: C.text3 }}>
                  <div>Workflow {campaign.workflow_id}</div>
                  <div>{dateLabel(campaign.created_at)}</div>
                  {campaign.lead_id && <div style={{ color: C.teal, marginTop: 4 }}>Lead #{campaign.lead_id}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : view === 'content' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.coral, marginBottom: 12 }}>Generate Stored Content</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {['linkedin', 'email', 'ad', 'blog'].map(type => (
                <button key={type} onClick={() => setContentType(type)} style={{ padding: '6px 12px', borderRadius: 20, border: `0.5px solid ${contentType === type ? C.coral : C.border}`, background: contentType === type ? 'rgba(240,106,64,0.12)' : 'transparent', color: contentType === type ? C.coral : C.text3, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>{type}</button>
              ))}
            </div>
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="Campaign goal, audience, offer, or product angle"
              rows={6}
              style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: 12 }}
            />
            <Btn onClick={generateContent} disabled={generating || !prompt.trim()} style={{ width: '100%', justifyContent: 'center', background: C.coral }}>
              {generating ? <><Spin /> Generating...</> : 'Generate and Store'}
            </Btn>
          </Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {content.length === 0 && <Card style={{ color: C.text3, fontSize: 13 }}>No stored marketing content yet.</Card>}
            {content.map(item => (
              <Card key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div>
                    <Badge type="info">{item.output_type}</Badge>
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.text3 }}>{dateLabel(item.created_at)}</span>
                  </div>
                  <Badge type={item.status === 'draft' ? 'warning' : 'success'}>{item.status}</Badge>
                </div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 8 }}>{item.prompt}</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.output}</div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.length === 0 && <Card style={{ color: C.text3, fontSize: 13 }}>No Marketing Agent events yet.</Card>}
          {events.map(event => (
            <Card key={event.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{event.event_type.replace(/\./g, ' ')}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{event.entity_type || 'event'} {event.entity_id ? `#${event.entity_id}` : ''}</div>
                </div>
                <div style={{ fontSize: 11, color: C.text3 }}>{dateLabel(event.created_at)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={event => event.target === event.currentTarget && setShowCampaign(false)}>
          <div style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', background: C.bg2, border: `0.5px solid ${C.border2}`, borderRadius: 12, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.coral }}>Lexi Campaign Workflow</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Creates campaign, lead, Sales task, outreach, and timeline events.</div>
              </div>
              <button onClick={() => setShowCampaign(false)} style={{ background: 'none', border: 'none', color: C.text3, fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              {campaignField('name', 'Campaign name')}
              {campaignField('channel', 'Channel')}
              <div style={{ gridColumn: '1/-1' }}>{campaignField('audience', 'Audience')}</div>
              <div style={{ gridColumn: '1/-1' }}>{campaignField('offer', 'Offer')}</div>
              {campaignField('leadName', 'Lead name')}
              {campaignField('leadCompany', 'Lead company')}
              {campaignField('leadEmail', 'Lead email', 'email')}
              {campaignField('value', 'Deal value', 'number')}
              {campaignField('score', 'Lead score', 'number')}
              <div style={{ gridColumn: '1/-1' }}>{campaignField('leadNotes', 'Lead notes')}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="ghost" onClick={() => setShowCampaign(false)}>Cancel</Btn>
              <Btn onClick={startCollaborativeCampaign} disabled={startingWorkflow || !campaignForm.name || !campaignForm.audience || !campaignForm.offer || !campaignForm.leadName} style={{ background: C.coral }}>
                {startingWorkflow ? <><Spin /> Starting...</> : 'Start Workflow'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
