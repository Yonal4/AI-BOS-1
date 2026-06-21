import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { C } from './design'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function SetupRequired() {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, fontFamily:"'Inter',system-ui,sans-serif", color:C.text, padding:24 }}>
      <div style={{ maxWidth:520, textAlign:'center' }}>
        <div style={{ width:56, height:56, background:'linear-gradient(135deg,#7c6dfa,#22d3b0)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', margin:'0 auto 20px' }}>B</div>
        <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8, letterSpacing:-0.5 }}>Authentication Setup Required</h2>
        <p style={{ fontSize:14, color:C.text2, lineHeight:1.7, marginBottom:24 }}>
          AI BOS uses Clerk for authentication. Add your Clerk publishable key to enable sign-up, sign-in, and organization management.
        </p>
        <div style={{ background:C.bg2, border:`0.5px solid ${C.border2}`, borderRadius:12, padding:'20px 24px', textAlign:'left', marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.text3, marginBottom:12, textTransform:'uppercase', letterSpacing:.5 }}>Setup Steps</div>
          {[
            { n:'1', t:'Create a Clerk account', d:'Go to clerk.com → Create application', href:'https://dashboard.clerk.com' },
            { n:'2', t:'Copy your Publishable Key', d:'Dashboard → API Keys → Publishable Key' },
            { n:'3', t:'Add to Replit Secrets', d:'VITE_CLERK_PUBLISHABLE_KEY = pk_live_...' },
            { n:'4', t:'Add Secret Key (optional)', d:'CLERK_SECRET_KEY = sk_live_... (for server auth)' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(124,109,250,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.purple2, flexShrink:0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{s.t}</div>
                <code style={{ fontSize:11, color:C.text3, background:'rgba(255,255,255,0.04)', padding:'2px 6px', borderRadius:4 }}>{s.d}</code>
              </div>
            </div>
          ))}
        </div>
        <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:C.purple, borderRadius:9, fontSize:14, fontWeight:600, color:'#fff', textDecoration:'none' }}>
          Open Clerk Dashboard →
        </a>
        <p style={{ fontSize:11, color:C.text3, marginTop:16 }}>After adding the secret, the app will automatically update — no restart needed in dev.</p>
      </div>
    </div>
  )
}

if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <SetupRequired />
    </React.StrictMode>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#7c6dfa',
            colorBackground: '#0d0d14',
            colorInputBackground: 'rgba(255,255,255,0.05)',
            colorText: '#f0f0f8',
            colorTextSecondary: '#9b9bb8',
            colorNeutral: '#6b6b88',
            borderRadius: '8px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '14px',
          },
          elements: {
            card: {
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              border: '0.5px solid rgba(124,109,250,0.3)',
              background: '#0d0d14',
            },
            socialButtonsBlockButton: {
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)',
            },
            formFieldInput: {
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.1)',
            },
            formButtonPrimary: { background: '#7c6dfa' },
            headerTitle: { color: '#f0f0f8' },
            headerSubtitle: { color: '#9b9bb8' },
          }
        }}
      >
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ClerkProvider>
    </React.StrictMode>
  )
}
