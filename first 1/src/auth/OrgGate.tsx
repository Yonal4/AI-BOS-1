import { ReactNode } from 'react'
import { useOrganization, CreateOrganization, UserButton } from '@clerk/clerk-react'
import { C } from '../design'
import { Spin } from '../components/ui'

export default function OrgGate({ children }: { children: ReactNode }) {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, fontFamily:"'Inter',system-ui,sans-serif" }}>
        <div style={{ textAlign:'center' }}>
          <Spin size={24} />
          <div style={{ color:C.text3, fontSize:13, marginTop:12 }}>Loading workspace…</div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:20, fontFamily:"'Inter',system-ui,sans-serif" }}>
        <div style={{ position:'absolute', top:16, right:16 }}>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div style={{ textAlign:'center', maxWidth:560, marginBottom:32 }}>
          <div style={{ width:56, height:56, background:'linear-gradient(135deg,#7c6dfa,#22d3b0)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', margin:'0 auto 16px' }}>B</div>
          <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8, letterSpacing:-0.5, color:C.text }}>Create your Organization</h2>
          <p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>
            AI BOS is organized around workspaces. Create your organization to unlock your AI workforce — all data is fully isolated per organization.
          </p>
        </div>
        <CreateOrganization
          afterCreateOrganizationUrl="/"
          skipInvitationScreen={false}
        />
      </div>
    )
  }

  return <>{children}</>
}
