import { useEffect, useState } from 'react'
import { C } from '../design'
import { Badge, Btn, Card, Spin } from '../components/ui'
import { BillingPlan, BillingStatus, getBillingStatus, getInvoices, openBillingPortal, startCheckout } from '../utils/billing'
import { useOrgId } from '../context/OrgContext'

function dollars(cents: number) {
  return `$${Number(cents || 0).toLocaleString()}`
}

function dateText(iso?: string | null) {
  if (!iso) return 'Not scheduled'
  return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
}

function usageRows(status: BillingStatus | null) {
  const usage = status?.usage || {}
  const limits = status?.plan?.limits || {}
  return [
    { label:'AI Actions', key:'agent_events', value:usage.agent_events || 0, limit:limits.aiActions },
    { label:'Company Brain Documents', key:'brain_documents', value:usage.brain_documents || 0, limit:limits.brainDocuments },
    { label:'Company Brain Searches', key:'brain_searches', value:usage.brain_searches || 0, limit:null },
    { label:'Seats', key:'seats', value:usage.seats || 1, limit:limits.seats },
    { label:'Agents', key:'agents', value:usage.agents || 0, limit:limits.agents },
  ]
}

export default function Billing() {
  const orgId = useOrgId()
  const [view, setView] = useState<'plan'|'usage'|'invoices'|'plans'>('plan')
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyPlan, setBusyPlan] = useState('')
  const [portalBusy, setPortalBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBillingStatus(orgId)
      setStatus(data)
      setInvoices(await getInvoices(orgId))
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [orgId])

  const checkout = async (plan: BillingPlan) => {
    setBusyPlan(plan.id)
    setError('')
    try {
      const { url } = await startCheckout(plan.id, orgId)
      window.location.href = url
    } catch (e: any) {
      setError(e.message)
    }
    setBusyPlan('')
  }

  const portal = async () => {
    setPortalBusy(true)
    setError('')
    try {
      const { url } = await openBillingPortal(orgId)
      window.location.href = url
    } catch (e: any) {
      setError(e.message)
    }
    setPortalBusy(false)
  }

  const currentPlanId = status?.subscription?.plan_id || null
  const currentPlan = status?.plan
  const subStatus = status?.subscription?.status || 'none'

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px', background:C.bg }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}>Billing</div>
          <div style={{ fontSize:12, color:C.text3, marginTop:2 }}>Stripe subscriptions, usage, invoices, and organization billing · {status?.orgId || orgId || 'default'}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {loading && <Spin color={C.purple2}/>}
          <Badge type={subStatus === 'active' || subStatus === 'trialing' ? 'success' : 'default'}>{subStatus}</Badge>
        </div>
      </div>

      {error && (
        <Card style={{ marginBottom:14, border:`0.5px solid rgba(240,106,64,0.25)`, background:'rgba(240,106,64,0.05)' }}>
          <div style={{ color:C.coral, fontSize:13, fontWeight:700, marginBottom:4 }}>Billing unavailable</div>
          <div style={{ color:C.text2, fontSize:12 }}>{error}</div>
        </Card>
      )}

      {!status?.stripeConfigured && !loading && (
        <Card style={{ marginBottom:14, border:`0.5px solid rgba(250,204,75,0.25)`, background:'rgba(250,204,75,0.05)' }}>
          <div style={{ color:C.gold, fontSize:13, fontWeight:700, marginBottom:4 }}>Stripe is not configured</div>
          <div style={{ color:C.text2, fontSize:12 }}>Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and plan price IDs in Replit Secrets before taking real payments.</div>
        </Card>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          ['plan','Subscription'],
          ['usage','Usage'],
          ['invoices','Invoices'],
          ['plans','Plans'],
        ].map(([id,label]) => (
          <button key={id} onClick={() => setView(id as any)} style={{ padding:'6px 14px', borderRadius:8, border:`0.5px solid ${view===id?C.purple:C.border}`, background:view===id?'rgba(124,109,250,0.12)':'transparent', color:view===id?C.purple2:C.text3, fontSize:12, cursor:'pointer' }}>{label}</button>
        ))}
      </div>

      {view === 'plan' && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
          <Card style={{ border:`0.5px solid ${currentPlan ? 'rgba(124,109,250,0.4)' : C.border}`, background:currentPlan?'rgba(124,109,250,0.04)':C.bg2 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:11, color:C.purple2, fontWeight:700, letterSpacing:.5, marginBottom:4 }}>CURRENT SUBSCRIPTION</div>
                <div style={{ fontSize:22, fontWeight:800 }}>{currentPlan?.name || 'No active plan'}</div>
                {currentPlan && <div style={{ fontSize:28, fontWeight:800, color:C.purple2, marginTop:4 }}>{dollars(currentPlan.price)}<span style={{ fontSize:14, color:C.text3 }}>/month</span></div>}
              </div>
              <Badge type={subStatus === 'active' || subStatus === 'trialing' ? 'success' : 'default'}>{subStatus}</Badge>
            </div>
            <div style={{ marginBottom:16 }}>
              {(currentPlan?.features || ['Choose a plan to activate AI BOS billing.']).map(f => (
                <div key={f} style={{ display:'flex', gap:8, fontSize:13, color:C.text2, marginBottom:7 }}>
                  <span style={{ color:C.teal }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ background:C.bg3, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:C.text3, marginBottom:2 }}>NEXT BILLING</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{dateText(status?.subscription?.current_period_end)}</div>
              </div>
              <div style={{ background:C.bg3, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:C.text3, marginBottom:2 }}>PLAN</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.gold }}>{currentPlan?.name || 'None'}</div>
              </div>
              <div style={{ background:C.bg3, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:C.text3, marginBottom:2 }}>CANCEL AT PERIOD END</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{status?.subscription?.cancel_at_period_end ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </Card>

          <div>
            <Card style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Subscription Management</div>
              <div style={{ fontSize:12, color:C.text2, lineHeight:1.6, marginBottom:12 }}>Use Stripe Billing Portal to update payment methods, download invoices, switch plans, or cancel.</div>
              <Btn onClick={portal} disabled={portalBusy || !status?.subscription?.stripe_customer_id} style={{ width:'100%', justifyContent:'center' }}>
                {portalBusy ? <><Spin/>Opening...</> : 'Open Billing Portal'}
              </Btn>
            </Card>
            <Card>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Organization Billing</div>
              {[
                ['Organization', status?.orgId || orgId || 'default'],
                ['Stripe Customer', status?.subscription?.stripe_customer_id || 'Not created'],
                ['Stripe Subscription', status?.subscription?.stripe_subscription_id || 'Not created'],
              ].map(([label,value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'8px 0', borderBottom:`0.5px solid ${C.border}` }}>
                  <span style={{ fontSize:11, color:C.text3 }}>{label}</span>
                  <span style={{ fontSize:11, color:C.text2, textAlign:'right', wordBreak:'break-all' }}>{value}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {view === 'usage' && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Usage This Month</div>
          {usageRows(status).map(row => {
            const pct = row.limit ? Math.min(100, Math.round((row.value / row.limit) * 100)) : null
            return (
              <div key={row.key} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:C.teal }}>{row.value.toLocaleString()}{row.limit ? ` / ${row.limit.toLocaleString()}` : ''}</span>
                </div>
                {pct !== null && (
                  <div>
                    <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:6 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:pct>85?C.coral:pct>65?C.gold:C.teal, borderRadius:6 }}/>
                    </div>
                    <div style={{ fontSize:10, color:C.text3, marginTop:2 }}>{pct}% of plan limit</div>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {view === 'invoices' && (
        <Card>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Stripe Invoices</div>
          {invoices.length === 0 ? (
            <div style={{ fontSize:12, color:C.text3 }}>No invoices found for this organization.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Invoice','Date','Amount','Status',''].map(h => <th key={h} style={{ textAlign:'left', fontSize:10, color:C.text3, padding:'6px 10px', borderBottom:`0.5px solid ${C.border}`, letterSpacing:.5 }}>{h}</th>)}</tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom:`0.5px solid ${C.border}` }}>
                    <td style={{ padding:'12px 10px', fontSize:13, fontWeight:600, color:C.purple2 }}>{inv.number || inv.id}</td>
                    <td style={{ padding:'12px 10px', fontSize:12, color:C.text2 }}>{dateText(inv.created)}</td>
                    <td style={{ padding:'12px 10px', fontSize:13, fontWeight:800, color:C.gold }}>{dollars(inv.amountPaid || inv.amountDue)}</td>
                    <td style={{ padding:'12px 10px' }}><Badge type={inv.status === 'paid' ? 'success' : 'default'}>{inv.status}</Badge></td>
                    <td style={{ padding:'12px 10px' }}>{inv.hostedInvoiceUrl && <a href={inv.hostedInvoiceUrl} target="_blank" style={{ fontSize:11, color:C.purple2 }}>Open</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {view === 'plans' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {(status?.plans || []).map(plan => (
            <Card key={plan.id} style={{ border:`0.5px solid ${currentPlanId === plan.id ? 'rgba(250,204,75,0.5)' : C.border}`, position:'relative' }}>
              {currentPlanId === plan.id && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:C.gold, color:'#000', fontSize:10, fontWeight:800, padding:'3px 12px', borderRadius:20 }}>Current Plan</div>}
              <div style={{ fontSize:15, fontWeight:800, marginBottom:8 }}>{plan.name}</div>
              <div style={{ fontSize:28, fontWeight:800, marginBottom:2 }}>{dollars(plan.price)}<span style={{ fontSize:14, color:C.text3 }}>/mo</span></div>
              <div style={{ fontSize:11, color:plan.stripePriceConfigured ? C.teal : C.coral, marginBottom:12 }}>{plan.stripePriceConfigured ? 'Stripe price configured' : 'Missing Stripe price ID'}</div>
              {plan.features.map(f => <div key={f} style={{ display:'flex', gap:6, fontSize:12, color:C.text2, marginBottom:6 }}><span style={{ color:C.teal }}>✓</span>{f}</div>)}
              <Btn disabled={busyPlan === plan.id || currentPlanId === plan.id || !plan.stripePriceConfigured} onClick={() => checkout(plan)} style={{ width:'100%', marginTop:12, justifyContent:'center' }} variant={currentPlanId === plan.id ? 'ghost' : 'primary'}>
                {busyPlan === plan.id ? <><Spin/>Opening checkout...</> : currentPlanId === plan.id ? 'Current Plan' : `Checkout ${plan.name}`}
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
