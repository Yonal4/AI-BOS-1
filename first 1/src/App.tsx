import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Landing from './pages/Landing'
import AppShell from './app/AppShell'
import OrgGate from './auth/OrgGate'

export default function App() {
  return (
    <>
      <SignedOut>
        <Landing />
      </SignedOut>
      <SignedIn>
        <OrgGate>
          <AppShell />
        </OrgGate>
      </SignedIn>
    </>
  )
}
