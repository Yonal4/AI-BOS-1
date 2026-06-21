export type DashboardAnalytics = {
  orgId: string
  totals: {
    leadsGenerated: number
    leadsContacted: number
    agentActivity: number
    documentsUploaded: number
    readyDocuments: number
    brainSearches: number
  }
  campaignPerformance: {
    activeCampaigns: number
    totalCampaigns: number
    campaignLeads: number
    leadConversionRate: number
    recentCampaigns: Array<any>
  }
  agentActivity: {
    totalEvents: number
    byAgent: Array<{ agent_id: string; agent_role: string; event_count: number; last_activity: string }>
    recentEvents: Array<any>
  }
}

export async function getDashboardAnalytics(orgId?: string | null): Promise<DashboardAnalytics> {
  const res = await fetch('/api/analytics/dashboard', {
    headers: orgId ? { 'x-org-id': orgId } : {}
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Analytics request failed')
  return data
}
