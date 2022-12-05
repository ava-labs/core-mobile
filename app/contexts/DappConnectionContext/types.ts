import { Dispatch } from 'react'
import { DeepLink } from 'services/walletconnect/types'
import { DappRpcRequest } from 'store/walletConnect/handlers/types'
import { ApprovedAppMeta } from 'store/walletConnect'

export interface DappConnectionState {
  pendingDeepLink: DeepLink | undefined
  setPendingDeepLink: Dispatch<DeepLink>
  onUserApproved: (
    request: DappRpcRequest<string, unknown>,
    data?: unknown // any extra data that you want to send to the store
  ) => void
  onUserRejected: (
    request: DappRpcRequest<string, unknown>,
    message?: string
  ) => void
  killSessions: (sessions: ApprovedAppMeta[]) => void
}
