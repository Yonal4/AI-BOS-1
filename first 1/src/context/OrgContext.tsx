import { createContext, useContext } from 'react'

interface OrgContextValue {
  orgId: string | null | undefined
}

export const OrgContext = createContext<OrgContextValue>({ orgId: null })

export function useOrgId() {
  return useContext(OrgContext).orgId
}
