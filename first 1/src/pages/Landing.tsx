import { useState } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'

const agents = [
  { id: 'M', name: 'Marketing', action: 'Creates campaign', color: '#ff7a45' },
  { id: 'S', name: 'Sales', action: 'Receives lead', color: '#8b7cff' },
  { id: 'B', name: 'Brain', action: 'Supplies context', color: '#22d3b0' },
]

const brainItems = [
  'Campaign history',
  'Lead status',
  'Outreach drafts',
  'Brand voice',
  'Product docs',
  'Search memory',
]

const trust = ['SOC2-ready architecture', 'Stripe billing', 'Org-scoped memory', 'Event audit trail']

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$299',
    line: 'For founders validating AI operations',
    features: ['Company Brain starter', 'Marketing Agent', 'Sales Agent', 'Event timeline'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$799',
    line: 'For teams replacing repetitive work',
    featured: true,
    features: ['Marketing and Sales collaboration', '25K AI actions', 'Shared memory', 'Priority queue'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '$1,999',
    line: 'For businesses running AI workflows daily',
    features: ['Company Brain scale', 'Advanced analytics', 'Billing portal', 'Custom workflows'],
  },
]

export default function Landing() {
  const [auth, setAuth] = useState<'signin' | 'signup' | null>(null)

  return (
    <div className="site">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        :root {
          color-scheme: dark;
          --bg: #050509;
          --panel: rgba(255,255,255,0.055);
          --panel-strong: rgba(255,255,255,0.085);
          --line: rgba(255,255,255,0.12);
          --muted: #9da0b8;
          --soft: #666a86;
          --text: #f7f7fb;
          --purple: #8b7cff;
          --teal: #22d3b0;
          --coral: #ff7a45;
          --gold: #f8c65a;
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); }
        .site {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% -10%, rgba(139,124,255,0.32), transparent 34rem),
            radial-gradient(circle at 88% 8%, rgba(34,211,176,0.16), transparent 26rem),
            linear-gradient(180deg, #070711 0%, #050509 52%, #07070c 100%);
          color: var(--text);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0;
          overflow-x: hidden;
        }
        a { color: inherit; text-decoration: none; }
        button { font-family: inherit; }

        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          background: rgba(5,5,9,0.72);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(22px);
        }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; }
        .mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, var(--purple), var(--teal));
          color: white;
          box-shadow: 0 0 36px rgba(139,124,255,0.42);
        }
        .navlinks { display: flex; gap: 26px; color: var(--muted); font-size: 13px; font-weight: 600; }
        .navlinks a:hover { color: white; }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.04);
          color: white;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
        .btn.primary {
          border: 0;
          background: linear-gradient(135deg, #ffffff, #cdd0ff 42%, #8b7cff);
          color: #080812;
          box-shadow: 0 12px 34px rgba(139,124,255,0.32);
        }

        .hero {
          min-height: 100vh;
          padding: 132px 28px 74px;
          display: grid;
          place-items: center;
          position: relative;
        }
        .hero-grid {
          width: min(1180px, 100%);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(380px, 520px);
          gap: 56px;
          align-items: center;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 30px;
          padding: 0 12px;
          border: 1px solid rgba(139,124,255,0.35);
          border-radius: 999px;
          background: rgba(139,124,255,0.12);
          color: #c8c2ff;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 22px;
        }
        .pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--teal);
          box-shadow: 0 0 18px var(--teal);
        }
        h1 {
          margin: 0;
          max-width: 760px;
          font-size: clamp(48px, 7vw, 92px);
          line-height: 0.96;
          font-weight: 900;
          letter-spacing: 0;
        }
        .h1-gradient {
          display: block;
          background: linear-gradient(120deg, #ffffff 0%, #bdb7ff 42%, #64e8ce 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-copy {
          max-width: 620px;
          margin: 24px 0 34px;
          color: var(--muted);
          font-size: 18px;
          line-height: 1.75;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 34px; }
        .hero-actions .btn { height: 48px; padding: 0 22px; font-size: 14px; }
        .proof-row { display: flex; gap: 22px; flex-wrap: wrap; color: var(--soft); font-size: 12px; font-weight: 700; }
        .proof-row span { display: inline-flex; align-items: center; gap: 8px; }
        .check { width: 16px; height: 16px; border-radius: 50%; background: rgba(34,211,176,0.12); color: var(--teal); display: grid; place-items: center; font-size: 11px; }

        .visual {
          min-height: 560px;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.035)),
            radial-gradient(circle at 30% 18%, rgba(139,124,255,0.2), transparent 18rem),
            radial-gradient(circle at 80% 78%, rgba(34,211,176,0.14), transparent 16rem);
          box-shadow: 0 34px 110px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14);
          position: relative;
          overflow: hidden;
          padding: 24px;
        }
        .visual:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(circle at center, black, transparent 78%);
          opacity: 0.5;
        }
        .viz-top {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .window-dots { display: flex; gap: 7px; }
        .window-dots i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.24); display: block; }
        .live-pill {
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34,211,176,0.12);
          border: 1px solid rgba(34,211,176,0.28);
          color: #8ff5df;
          font-size: 11px;
          font-weight: 800;
        }
        .agent-map {
          position: relative;
          height: 296px;
          display: grid;
          place-items: center;
        }
        .brain-core {
          width: 154px;
          height: 154px;
          border-radius: 38px;
          display: grid;
          place-items: center;
          text-align: center;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04)),
            radial-gradient(circle at 40% 30%, rgba(139,124,255,0.55), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(34,211,176,0.34), transparent 62%);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 0 70px rgba(139,124,255,0.22);
          z-index: 2;
        }
        .brain-core strong { display: block; font-size: 15px; margin-bottom: 5px; }
        .brain-core span { color: var(--muted); font-size: 11px; font-weight: 700; }
        .agent-card {
          position: absolute;
          width: 148px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(7,7,14,0.74);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(18px);
          z-index: 3;
        }
        .agent-card:nth-child(2) { top: 6px; left: 10px; }
        .agent-card:nth-child(3) { top: 18px; right: 0; }
        .agent-card:nth-child(4) { bottom: 0; left: 50%; transform: translateX(-50%); }
        .agent-id { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; font-weight: 900; margin-bottom: 9px; color: white; }
        .agent-name { font-size: 12px; font-weight: 800; }
        .agent-action { color: var(--muted); font-size: 11px; margin-top: 2px; }
        .line {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,124,255,0.65), rgba(34,211,176,0.55), transparent);
          transform-origin: center;
          z-index: 1;
        }
        .line.one { width: 270px; transform: rotate(25deg); top: 98px; left: 96px; }
        .line.two { width: 260px; transform: rotate(-27deg); top: 112px; right: 98px; }
        .line.three { width: 220px; transform: rotate(90deg); bottom: 62px; left: 150px; }
        .event-list {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 9px;
        }
        .event {
          display: grid;
          grid-template-columns: 24px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          background: rgba(5,5,9,0.48);
        }
        .event b { font-size: 12px; }
        .event small { color: var(--soft); font-weight: 700; }
        .event-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 14px var(--teal); }

        .section { padding: 112px 28px; }
        .section-inner { width: min(1140px, 100%); margin: 0 auto; }
        .section-head { max-width: 720px; margin-bottom: 44px; }
        .label { color: var(--teal); font-size: 12px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
        h2 { margin: 0; font-size: clamp(34px, 5vw, 58px); line-height: 1.02; font-weight: 900; letter-spacing: 0; }
        .section-copy { margin-top: 16px; color: var(--muted); font-size: 16px; line-height: 1.75; }

        .collab-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .workflow-card, .brain-card, .trust-card, .price-card {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .workflow-card { padding: 24px; }
        .step {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .step:last-child { border-bottom: 0; }
        .step-num {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(139,124,255,0.13);
          color: #c8c2ff;
          font-weight: 900;
        }
        .step h3 { margin: 0 0 4px; font-size: 14px; }
        .step p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.6; }

        .brain-card {
          padding: 24px;
          position: relative;
          overflow: hidden;
          min-height: 410px;
        }
        .brain-orbit {
          position: absolute;
          inset: 42px;
          border: 1px solid rgba(139,124,255,0.16);
          border-radius: 50%;
        }
        .brain-orbit.two { inset: 86px; border-color: rgba(34,211,176,0.16); }
        .brain-node {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 140px;
          height: 140px;
          border-radius: 36px;
          display: grid;
          place-items: center;
          text-align: center;
          background: linear-gradient(135deg, rgba(139,124,255,0.32), rgba(34,211,176,0.18));
          border: 1px solid rgba(255,255,255,0.16);
          font-weight: 900;
        }
        .brain-chip {
          position: relative;
          display: inline-flex;
          margin: 8px 6px 0 0;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
          z-index: 2;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .trust-card { padding: 20px; min-height: 132px; }
        .trust-card strong { display: block; font-size: 15px; margin-bottom: 8px; }
        .trust-card span { color: var(--muted); font-size: 13px; line-height: 1.6; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .price-card { padding: 24px; position: relative; }
        .price-card.featured {
          border-color: rgba(139,124,255,0.48);
          background:
            radial-gradient(circle at 50% 0%, rgba(139,124,255,0.24), transparent 18rem),
            linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04));
        }
        .tag {
          position: absolute;
          top: -12px;
          right: 18px;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          background: var(--purple);
          color: white;
          font-size: 11px;
          font-weight: 900;
        }
        .plan-name { font-size: 16px; font-weight: 900; margin-bottom: 8px; }
        .plan-price { font-size: 38px; font-weight: 900; margin: 16px 0 8px; }
        .plan-price span { color: var(--soft); font-size: 14px; font-weight: 700; }
        .plan-line { min-height: 44px; color: var(--muted); font-size: 13px; line-height: 1.6; }
        .features { margin: 22px 0; display: grid; gap: 10px; }
        .feature { color: var(--muted); font-size: 13px; display: flex; gap: 9px; }

        .cta {
          padding: 118px 28px;
          text-align: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(139,124,255,0.24), transparent 28rem),
            linear-gradient(180deg, transparent, rgba(34,211,176,0.055));
        }
        .cta h2 { max-width: 840px; margin: 0 auto; }
        .cta p { max-width: 620px; margin: 18px auto 34px; color: var(--muted); line-height: 1.75; }
        .footer {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 30px 40px;
          color: var(--soft);
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .nav { padding: 0 20px; }
          .navlinks { display: none; }
          .hero { padding-top: 112px; }
          .hero-grid, .collab-grid, .pricing-grid { grid-template-columns: 1fr; }
          .visual { min-height: 520px; }
          .trust-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .nav { height: 64px; }
          .nav-actions .btn:first-child { display: none; }
          .hero { padding: 96px 18px 52px; }
          .hero-grid { gap: 34px; }
          .hero-actions .btn { width: 100%; justify-content: center; }
          .visual { min-height: 600px; padding: 16px; border-radius: 22px; }
          .agent-map { height: 360px; }
          .agent-card { width: 136px; }
          .agent-card:nth-child(2) { top: 0; left: 0; }
          .agent-card:nth-child(3) { top: 0; right: 0; }
          .agent-card:nth-child(4) { bottom: 0; left: 50%; }
          .line { display: none; }
          .section { padding: 76px 18px; }
          .trust-grid { grid-template-columns: 1fr; }
          .footer { padding: 26px 18px; }
        }
      `}</style>

      <nav className="nav">
        <a className="brand" href="#">
          <span className="mark">B</span>
          <span>AI BOS</span>
        </a>
        <div className="navlinks">
          <a href="#workflow">Workflow</a>
          <a href="#brain">Company Brain</a>
          <a href="#trust">Trust</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-actions">
          <button className="btn" onClick={() => setAuth('signin')}>Log in</button>
          <button className="btn primary" onClick={() => setAuth('signup')}>Start free</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="pulse" /> Agent collaboration engine for modern teams</div>
              <h1>Run the business layer <span className="h1-gradient">with AI employees.</span></h1>
              <p className="hero-copy">
                AI BOS coordinates Company Brain, Marketing Agent, and Sales Agent through one shared memory layer. Every action is tracked, scoped to your organization, and ready for production.
              </p>
              <div className="hero-actions">
                <button className="btn primary" onClick={() => setAuth('signup')}>Start building</button>
                <a className="btn" href="#workflow" style={{ display:'inline-flex', alignItems:'center' }}>See the system</a>
              </div>
              <div className="proof-row">
                <span><i className="check">✓</i> Real event timeline</span>
                <span><i className="check">✓</i> Stripe billing</span>
                <span><i className="check">✓</i> Company Brain</span>
              </div>
            </div>

            <div className="visual" aria-label="AI BOS collaboration visualization">
              <div className="viz-top">
                <div className="window-dots"><i/><i/><i/></div>
                <div className="live-pill"><span className="pulse" /> Live workflow</div>
              </div>
              <div className="agent-map">
                <div className="line one" />
                <div className="line two" />
                <div className="line three" />
                <div className="brain-core"><div><strong>Shared<br/>Memory</strong><span>event bus</span></div></div>
                {agents.map(agent => (
                  <div className="agent-card" key={agent.id}>
                    <div className="agent-id" style={{ background: agent.color }}>{agent.id}</div>
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-action">{agent.action}</div>
                  </div>
                ))}
              </div>
              <div className="event-list">
                {[
                  ['Marketing Agent', 'created campaign'],
                  ['Marketing Agent', 'created lead'],
                  ['Sales Agent', 'generated outreach'],
                ].map(([who, action], i) => (
                  <div className="event" key={i}>
                    <span className="event-dot" />
                    <b>{who} {action}</b>
                    <small>stored</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="workflow">
          <div className="section-inner">
            <div className="section-head">
              <div className="label">Agent collaboration</div>
              <h2>Not separate chatbots. A coordinated operating system.</h2>
              <p className="section-copy">AI BOS gives every agent a role, memory, event history, and delegation path. The result is a real workflow, not a pile of disconnected prompts.</p>
            </div>
            <div className="collab-grid">
              <div className="workflow-card">
                {[
                  ['01', 'Marketing creates a campaign', 'Lexi builds the campaign, stores the event, and creates the first lead.'],
                  ['02', 'Sales receives the lead', 'Aria is delegated the task with all campaign context attached.'],
                  ['03', 'Outreach is generated', 'The lead status updates, and every action is written to the event timeline.'],
                  ['04', 'Company Brain persists memory', 'The campaign, lead, outreach, and timeline remain available after refreshes and restarts.'],
                ].map(([num, title, copy]) => (
                  <div className="step" key={num}>
                    <div className="step-num">{num}</div>
                    <div><h3>{title}</h3><p>{copy}</p></div>
                  </div>
                ))}
              </div>
              <div className="brain-card" id="brain">
                <div className="brain-orbit" />
                <div className="brain-orbit two" />
                <div className="brain-node">Company<br/>Brain</div>
                <div style={{ position:'relative', zIndex:2, paddingTop:250 }}>
                  {brainItems.map(item => <span className="brain-chip" key={item}>{item}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="trust">
          <div className="section-inner">
            <div className="section-head">
              <div className="label">Trust layer</div>
              <h2>Built like software your business can rely on.</h2>
              <p className="section-copy">Every workflow is organization-scoped, observable, and connected to real systems like Stripe, Postgres, and your Company Brain.</p>
            </div>
            <div className="trust-grid">
              {trust.map((item, index) => (
                <div className="trust-card" key={item}>
                  <strong>{item}</strong>
                  <span>{[
                    'Designed for auditability, ownership, and deployment discipline.',
                    'Checkout, subscription state, invoices, portal, and webhooks.',
                    'Leads, documents, events, billing, and memory stay tenant-aware.',
                    'Every agent action becomes a searchable timeline event.',
                  ][index]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="section-inner">
            <div className="section-head">
              <div className="label">Pricing</div>
              <h2>Start focused. Scale into a full AI workforce.</h2>
              <p className="section-copy">Choose the plan that matches your operating rhythm. Upgrade when your agents are ready to take on more work.</p>
            </div>
            <div className="pricing-grid">
              {plans.map(plan => (
                <div className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.id}>
                  {plan.featured && <div className="tag">Best value</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-line">{plan.line}</div>
                  <div className="plan-price">{plan.price}<span>/mo</span></div>
                  <div className="features">
                    {plan.features.map(feature => <div className="feature" key={feature}><span className="check">✓</span>{feature}</div>)}
                  </div>
                  <button className={`btn ${plan.featured ? 'primary' : ''}`} style={{ width:'100%' }} onClick={() => setAuth('signup')}>{plan.featured ? 'Start Growth' : `Start ${plan.name}`}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Put your agents, memory, billing, and analytics in one operating layer.</h2>
          <p>AI BOS is the business control plane for founders who want software that actually does the work.</p>
          <button className="btn primary" style={{ height:52, padding:'0 28px', fontSize:15 }} onClick={() => setAuth('signup')}>Start AI BOS</button>
        </section>
      </main>

      <footer className="footer">
        <div className="brand"><span className="mark">B</span><span>AI BOS</span></div>
        <div>Product · Pricing · Security · Docs · Privacy</div>
      </footer>

      {auth && (
        <div
          onClick={() => setAuth(null)}
          style={{ position:'fixed', inset:0, background:'rgba(5,5,9,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            {auth === 'signin'
              ? <SignIn routing="hash" afterSignInUrl="/" />
              : <SignUp routing="hash" afterSignUpUrl="/" />
            }
            <div style={{ display:'flex', gap:16, fontSize:13, color:'rgba(255,255,255,0.5)' }}>
              {auth === 'signin'
                ? <><span>No account?</span><button onClick={() => setAuth('signup')} style={{ background:'none', border:'none', color:'#8b7cff', cursor:'pointer', fontSize:13, padding:0 }}>Sign up free</button></>
                : <><span>Already have an account?</span><button onClick={() => setAuth('signin')} style={{ background:'none', border:'none', color:'#8b7cff', cursor:'pointer', fontSize:13, padding:0 }}>Log in</button></>
              }
              <button onClick={() => setAuth(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:13, padding:0 }}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
