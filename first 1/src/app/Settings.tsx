import { useState } from 'react'
import { OrganizationProfile, useOrganization } from '@clerk/clerk-react'
import { C, AGENTS } from '../design'
import { Card, Btn, Badge } from '../components/ui'

export default function Settings() {
  const [view, setView] = useState('profile')
  const [saved, setSaved] = useState<string|null>(null)
  const [autonomy, setAutonomy] = useState<Record<string,number>>({ aria:75, marcus:90, lexi:70, felix:60, nova:80 })
  const { organization, membership } = useOrganization()

  const save = (section: string) => {
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  const role = membership?.role
  const isAdmin = role === 'org:admin'

  const SETTINGS_TABS = [
    {v:'profile',       l:'Company Profile'},
    {v:'agents',        l:'Agent Settings'},
    {v:'team',          l:'Team & Permissions'},
    {v:'ai',            l:'AI Preferences'},
    {v:'notifications', l:'Notification Prefs'},
    {v:'security',      l:'Security'},
  ]

  return (
    <div style={{ height:'100%', overflow:'auto', padding:'20px', background:C.bg, boxSizing:'border-box' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>⚙️ Settings</div>
        <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>
          Company, agents, team, and preferences
          {organization && <span style={{ marginLeft:8, color:C.purple2, fontWeight:600 }}>· {organization.name}</span>}
          {role && <span style={{ marginLeft:8, padding:'2px 8px', background:'rgba(124,109,250,0.12)', border:`0.5px solid rgba(124,109,250,0.25)`, borderRadius:20, fontSize:10, color:C.purple2, fontWeight:600 }}>{role === 'org:admin' ? 'Admin' : 'Member'}</span>}
        </div>
      </div>

      <div style={{ display:'flex', gap:16 }}>
        {/* Left nav */}
        <div style={{ width:180, flexShrink:0 }}>
          {SETTINGS_TABS.map(s => (
            <div key={s.v} onClick={() => setView(s.v)} style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', color:view===s.v?C.purple2:C.text3, background:view===s.v?'rgba(124,109,250,0.12)':'transparent', fontSize:13, marginBottom:2, fontWeight:view===s.v?600:400, border:view===s.v?`0.5px solid rgba(124,109,250,0.25)`:'0.5px solid transparent' }}>{s.l}</div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {view==='profile' && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Company Profile</div>
              {[{l:'Company Name',p:organization?.name||'Acme Inc.',t:'text'},{l:'Website',p:'https://acme.com',t:'text'},{l:'Industry',p:'SaaS / Technology',t:'text'},{l:'Team Size',p:'11-50 employees',t:'text'},{l:'Timezone',p:'America/New_York (EST)',t:'text'}].map(f => (
                <div key={f.l} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, color:C.text2, marginBottom:5 }}>{f.l}</div>
                  <input defaultValue={f.p} disabled={!isAdmin} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none', opacity:isAdmin?1:0.6 }}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:C.text2, marginBottom:5 }}>Company Description (for AI context)</div>
                <textarea disabled={!isAdmin} defaultValue="We build AI automation tools for growing startups. Our ICP is funded B2B SaaS companies with 10-200 employees looking to scale operations without hiring." style={{ width:'100%', minHeight:90, padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6, fontFamily:'inherit', opacity:isAdmin?1:0.6 }}/>
              </div>
              {isAdmin ? (
                <Btn onClick={() => save('profile')} style={{ minWidth:120 }}>{saved==='profile'?'✓ Saved!':'Save Profile'}</Btn>
              ) : (
                <div style={{ fontSize:12, color:C.text3 }}>Admin access required to edit company profile.</div>
              )}
            </Card>
          )}

          {view==='agents' && (
            <div>
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Autonomy Levels</div>
                <div style={{ fontSize:12, color:C.text2, marginBottom:16 }}>Higher autonomy = agents act without approval. Lower = more human oversight.</div>
                {AGENTS.map(a => (
                  <div key={a.id} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:15 }}>{a.emoji}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:a.color }}>{a.name}</span>
                        <span style={{ fontSize:11, color:C.text3 }}>{a.role}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:a.color }}>{autonomy[a.id]}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={autonomy[a.id]} disabled={!isAdmin}
                      onChange={e => setAutonomy(p => ({ ...p, [a.id]:+e.target.value }))}
                      style={{ width:'100%', accentColor:a.color, cursor:isAdmin?'pointer':'not-allowed' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.text3, marginTop:2 }}>
                      <span>Always ask approval</span>
                      <span>Fully autonomous</span>
                    </div>
                  </div>
                ))}
                {isAdmin && <Btn onClick={() => save('agents')}>{saved==='agents'?'✓ Saved!':'Save Settings'}</Btn>}
              </Card>
              <Card>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Agent Personas</div>
                {AGENTS.map(a => (
                  <div key={a.id} style={{ padding:'12px 0', borderBottom:`0.5px solid ${C.border}` }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                      <span>{a.emoji}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:a.color }}>{a.name}</span>
                      <Badge type="success">Active</Badge>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button disabled={!isAdmin} style={{ padding:'5px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text3, fontSize:11, cursor:isAdmin?'pointer':'not-allowed', opacity:isAdmin?1:0.5 }}>Configure</button>
                      <button disabled={!isAdmin} style={{ padding:'5px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border}`, borderRadius:6, color:C.text3, fontSize:11, cursor:isAdmin?'pointer':'not-allowed', opacity:isAdmin?1:0.5 }}>Tone & Voice</button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {view==='team' && (
            <div>
              {isAdmin ? (
                <OrganizationProfile
                  appearance={{
                    elements: {
                      rootBox: { width: '100%' },
                      card: {
                        background: C.bg2,
                        border: `0.5px solid ${C.border}`,
                        borderRadius: '12px',
                        boxShadow: 'none',
                        width: '100%',
                        maxWidth: '100%',
                      },
                      navbar: { display: 'none' },
                      pageScrollBox: { padding: '16px' },
                      headerTitle: { color: C.text, fontSize: '14px', fontWeight: '700' },
                      headerSubtitle: { color: C.text3, fontSize: '12px' },
                      formFieldLabel: { color: C.text2, fontSize: '12px' },
                      formFieldInput: {
                        background: 'rgba(255,255,255,0.04)',
                        border: `0.5px solid ${C.border2}`,
                        color: C.text,
                        fontSize: '13px',
                      },
                      formButtonPrimary: {
                        background: C.purple,
                        fontSize: '13px',
                      },
                      tableHead: { color: C.text3, fontSize: '11px' },
                      tableCellText: { color: C.text2, fontSize: '12px' },
                      badge: { fontSize: '10px' },
                      memberListTableRow: { borderColor: C.border },
                    }
                  }}
                  routing="hash"
                />
              ) : (
                <Card>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Team Members</div>
                  <div style={{ padding:'24px', textAlign:'center', color:C.text3, fontSize:13 }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>🔒</div>
                    Admin access required to manage team members and invitations.
                  </div>
                </Card>
              )}
            </div>
          )}

          {view==='ai' && (
            <div>
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>AI Preferences</div>
                {[
                  { l:'Default response style', opts:['Professional','Conversational','Formal','Direct'], def:'Professional' },
                  { l:'AI language', opts:['English','Spanish','French','German','Portuguese'], def:'English' },
                  { l:'Default max tokens per response', opts:['300','500','700','1000','2000'], def:'700' },
                ].map(s => (
                  <div key={s.l} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, color:C.text2, marginBottom:5 }}>{s.l}</div>
                    <select defaultValue={s.def} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none' }}>
                      {s.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, color:C.text2, marginBottom:5 }}>Company Brand Voice (used by all agents)</div>
                  <textarea defaultValue="Bold, direct, outcome-focused. We speak like a trusted advisor — confident but not arrogant. Use data and specifics. Avoid buzzwords." style={{ width:'100%', minHeight:80, padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`0.5px solid ${C.border2}`, borderRadius:8, color:C.text, fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6, fontFamily:'inherit' }}/>
                </div>
                <Btn onClick={() => save('ai')}>{saved==='ai'?'✓ Saved!':'Save Preferences'}</Btn>
              </Card>
            </div>
          )}

          {view==='security' && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Security Settings</div>
              <div style={{ padding:'10px 14px', background:'rgba(124,109,250,0.06)', border:`0.5px solid rgba(124,109,250,0.25)`, borderRadius:8, fontSize:12, color:C.purple2, marginBottom:16 }}>
                🔐 Authentication is managed by Clerk. SSO, MFA, and advanced security settings are configured through your Clerk dashboard.
              </div>
              {[{l:'Two-factor authentication',s:'Managed by Clerk',c:C.teal},{l:'Session timeout',s:'4 hours',c:C.text2},{l:'IP allowlist',s:'Clerk dashboard',c:C.text3},{l:'SSO / SAML',s:'Clerk Enterprise',c:C.text3}].map(s => (
                <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <span style={{ fontSize:13, color:C.text2 }}>{s.l}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:600, color:s.c }}>{s.s}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {view==='notifications' && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Notification Preferences</div>
              {[
                { l:'Agent approval requests', email:true,  push:true,  slack:true  },
                { l:'New meetings booked',      email:true,  push:true,  slack:false },
                { l:'Churn risk alerts',         email:true,  push:true,  slack:true  },
                { l:'Revenue milestones',        email:true,  push:false, slack:true  },
                { l:'Weekly digest report',      email:true,  push:false, slack:false },
                { l:'Agent errors / failures',   email:true,  push:true,  slack:true  },
              ].map((n,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <span style={{ fontSize:13, color:C.text2 }}>{n.l}</span>
                  <div style={{ display:'flex', gap:16 }}>
                    {[{l:'Email',v:n.email},{l:'Push',v:n.push},{l:'Slack',v:n.slack}].map(c => (
                      <div key={c.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:32, height:16, borderRadius:8, background:c.v?C.teal:'rgba(255,255,255,0.1)', cursor:'pointer', display:'flex', alignItems:'center', padding:'2px', transition:'.2s' }}>
                          <div style={{ width:12, height:12, borderRadius:'50%', background:'#fff', transition:'.2s', transform:c.v?'translateX(16px)':'translateX(0)' }}/>
                        </div>
                        <span style={{ fontSize:10, color:C.text3 }}>{c.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Btn onClick={() => save('notifs')} style={{ marginTop:14 }}>{saved==='notifs'?'✓ Saved!':'Save Preferences'}</Btn>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
