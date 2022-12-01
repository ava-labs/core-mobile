import { Dispatch } from 'react'
import { DeepLink } from 'services/walletconnect/types'
import { DappRpcRequest } from 'store/rpc/handlers/types'

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
}
