import { Dispatch } from 'react'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { PeerMetadata, RPC_EVENT, Transaction } from 'screens/rpc/util/types'
import { DeepLink } from 'services/walletconnect/types'

export interface AdditionalMessageParams {
  data?: string
  from?: string
  password?: string
}

export type DappEvent = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: JsonRpcRequest<any[]> & AdditionalMessageParams
  peerMeta: PeerMetadata
  eventType: RPC_EVENT
  handled?: boolean
}

export interface DappConnectionState {
  dappEvent?: DappEvent
  onSessionApproved: () => void
  onSessionRejected: () => void
  onContactUpdated: (contact: CoreWebContact) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomCallApproved: (id: number, result: any) => void
  onTransactionCallApproved: (
    tx: Transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<{ hash?: string; error?: any }>
  onMessageCallApproved: (
    payload: DappEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<{ hash?: string; error?: any }>
  onCallRejected: (id?: number, message?: string) => void
  setEventHandled: (handled: boolean) => void
  pendingDeepLink: DeepLink | undefined
  setPendingDeepLink: Dispatch<DeepLink>

  // similar to onCustomCallApproved except this is triggered by the user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomCallPromptApproved: (result: any) => void

  // similar to onCallRejected except this is triggered by the user
  onCallPromptRejected: (message?: string) => void
}

export type CoreWebAccount = {
  index: number
  active: boolean
  addressC: string
  addressBTC?: string
  name: string
}

export type CoreWebContact = {
  id: string
  address: string
  addressBTC: string
  name: string
}
