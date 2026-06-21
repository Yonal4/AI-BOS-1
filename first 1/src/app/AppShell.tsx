import { useState } from 'react'
import { UserButton, OrganizationSwitcher, useOrganization } from '@clerk/clerk-react'
import { C, AGENTS } from '../design'
import { Pill } from '../components/ui'
import { OrgContext } from '../context/OrgContext'
import Dashboard from './Dashboard'
import CompanyBrain from './CompanyBrain'
import SalesHub from './SalesHub'
import MarketingHub from './MarketingHub'
import Notifications from './Notifications'
import Settings from './Settings'

const NAV_SECTIONS = [
  { label: 'PRODUCT', items: [
    { id: 'dashboard', icon: 'D', label: 'Dashboard' },
    { id: 'brain', icon: 'B', label: 'Company Brain' },
  ] },
  { label: 'AGENTS', items: [
    { id: 'marketing', icon: 'M', label: 'Marketing Agent' },
    { id: 'sales', icon: 'S', label: 'Sales Agent' },
  ] },
  { label: 'COLLABORATION', items: [
    { id: 'timeline', icon: 'T', label: 'Activity Timeline' },
  ] },
  { label: 'ACCOUNT', items: [
    { id: 'settings', icon: 'A', label: 'Settings' },
  ] },
]

export default function AppShell() {
  const [view, setView] = useState('dashboard')
  const { organization } = useOrganization()
  const orgId = organization?.id ?? null
  const activeAgents = AGENTS.filter(agent => ['lexi', 'aria'].includes(agent.id))

  const views: Record<string, JSX.Element> = {
    dashboard: <Dashboard onNavigate={setView} />,
    brain: <CompanyBrain />,
    marketing: <MarketingHub />,
    sales: <SalesHub />,
    timeline: <Notifications />,
    settings: <Settings />,
  }

  const currentLabel = NAV_SECTIONS
    .flatMap(section => section.items)
    .find(item => item.id === view)?.label || 'Dashboard'

  return (
    <OrgContext.Provider value={{ orgId }}>
      <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: "'Inter',system-ui,sans-serif", color: C.text, overflow: 'hidden' }}>
        <aside style={{ width: 214, background: C.bg2, borderRight: `0.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#7c6dfa,#22d3b0)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>B</div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>AI BOS</span>
            <Pill color={C.teal} bg="rgba(34,211,176,0.12)" style={{ fontSize: 10, marginLeft: 'auto' }}>Core</Pill>
          </div>

          <div style={{ padding: '8px 12px', borderBottom: `0.5px solid ${C.border}` }}>
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/"
              afterCreateOrganizationUrl="/"
              appearance={{
                elements: {
                  organizationSwitcherTrigger: {
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: `0.5px solid ${C.border2}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text2,
                    fontSize: '12px',
                    justifyContent: 'flex-start',
                    gap: '8px',
                  },
                  organizationSwitcherTriggerIcon: { color: C.text3 },
                  organizationPreviewTextContainer: { color: C.text2 },
                }
              }}
            />
          </div>

          <div style={{ padding: '8px 12px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {activeAgents.map(agent => (
              <div key={agent.id} title={`${agent.name} - ${agent.role}`} style={{ width: 22, height: 22, borderRadius: '50%', background: agent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {agent.emoji}
              </div>
            ))}
            <span style={{ fontSize: 10, color: C.teal, marginLeft: 4, alignSelf: 'center' }}>2 active</span>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 0.8, textTransform: 'uppercase', padding: '10px 8px 4px' }}>{section.label}</div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 8,
                      marginBottom: 1,
                      background: view === item.id ? 'rgba(124,109,250,0.12)' : 'transparent',
                      color: view === item.id ? C.purple2 : C.text3,
                      fontSize: 12,
                      fontWeight: view === item.id ? 600 : 400,
                      border: view === item.id ? `0.5px solid rgba(124,109,250,0.25)` : '0.5px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.05)' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {view === item.id && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.teal }} />}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div style={{ padding: '10px 12px', borderTop: `0.5px solid ${C.border}`, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
            All visible data is organization scoped and loaded from the database.
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, background: C.bg2 }}>
            <div style={{ flex: 1, fontSize: 13, color: C.text3 }}>
              <span style={{ color: C.text2 }}>AI BOS</span>
              <span style={{ margin: '0 6px' }}>/</span>
              <span style={{ color: C.purple2 }}>{currentLabel}</span>
            </div>
            {organization && (
              <span style={{ fontSize: 11, color: C.text3, padding: '3px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 20, border: `0.5px solid ${C.border}` }}>
                {organization.name}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,211,176,0.08)', border: `0.5px solid rgba(34,211,176,0.25)`, borderRadius: 20, padding: '4px 12px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal }} />
              <span style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>Core workflow online</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {views[view] || views.dashboard}
          </div>
        </main>
      </div>
    </OrgContext.Provider>
  )
}
