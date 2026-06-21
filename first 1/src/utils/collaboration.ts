export type AgentTask = {
  id: number
  workflow_id: string
  from_agent: string
  to_agent: string
  task_type: string
  status: string
  payload: any
  result: any
  created_at: string
}

export type AgentEvent = {
  id: number
  workflow_id: string
  agent_id: string
  agent_role: string
  event_type: string
  entity_type: string | null
  entity_id: string | null
  payload: any
  created_at: string
}

export type SharedMemory = {
  id: number
  memory_key: string
  entity_type: string
  entity_id: string
  owner_agent: string
  value: any
  updated_at: string
}

export async function collaborationApi(path = '/', opts: RequestInit = {}, orgId?: string | null) {
  const res = await fetch(`/api/collaboration${path}`, {
    ...opts,
    headers: {
      ...(orgId ? { 'x-org-id': orgId } : {}),
      ...(opts.headers as Record<string, string> || {})
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Collaboration request failed')
  return data
}

export async function createCollaborativeCampaign(input: any, orgId?: string | null) {
  return collaborationApi('/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }, orgId)
}

export async function getAgentTasks(agent: 'sales' | 'marketing', orgId?: string | null): Promise<AgentTask[]> {
  const data = await collaborationApi(`/tasks?agent=${agent}`, {}, orgId)
  return data.tasks || []
}

export async function getSharedMemory(entityType?: string, orgId?: string | null): Promise<SharedMemory[]> {
  const qs = entityType ? `?entityType=${encodeURIComponent(entityType)}` : ''
  const data = await collaborationApi(`/memory${qs}`, {}, orgId)
  return data.memory || []
}

export async function getRecentEvents(orgId?: string | null): Promise<AgentEvent[]> {
  const data = await collaborationApi('/events?limit=30', {}, orgId)
  return data.events || []
}

export async function getTimelineEvents(filters: {
  agent?: string
  eventType?: string
  search?: string
  limit?: number
} = {}, orgId?: string | null): Promise<AgentEvent[]> {
  const params = new URLSearchParams()
  if (filters.agent && filters.agent !== 'all') params.set('agent', filters.agent)
  if (filters.eventType && filters.eventType !== 'all') params.set('eventType', filters.eventType)
  if (filters.search) params.set('search', filters.search)
  params.set('limit', String(filters.limit || 100))
  const data = await collaborationApi(`/events?${params.toString()}`, {}, orgId)
  return data.events || []
}
