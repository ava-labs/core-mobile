import { Dispatch } from 'react'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { Contact as SharedContact } from '@avalabs/types'
import {
  PeerMetadata,
  RPC_EVENT,
  Transaction,
  TransactionParams
} from 'screens/rpc/util/types'
import { DeepLink } from 'services/walletconnect/types'

export type DappSessionEvent = {
  peerMeta: PeerMetadata
  eventType: RPC_EVENT.SESSION_REQUEST
  handled?: boolean
}

export type DappSignMessageEvent = {
  payload: JsonRpcRequest<TransactionParams[]>
  peerMeta: PeerMetadata
  eventType: RPC_EVENT.SIGN_MESSAGE
  handled?: boolean

  // additional message params
  data?: string
  from?: string
  password?: string
}

export type DappSignTransactionEvent = {
  payload: JsonRpcRequest<TransactionParams[]>
  peerMeta: PeerMetadata
  eventType: RPC_EVENT.SIGN_TRANSACTION
  handled?: boolean
}

export type DappUpdateContactEvent = {
  payload: JsonRpcRequest<SharedContact[] | undefined>
  peerMeta: PeerMetadata
  eventType: RPC_EVENT.UPDATE_CONTACT
  handled?: boolean
  contact: SharedContact
}

export type DappEvent =
  | DappSessionEvent
  | DappSignMessageEvent
  | DappSignTransactionEvent
  | DappUpdateContactEvent

export interface DappConnectionState {
  dappEvent?: DappEvent
  onSessionApproved: () => void
  onSessionRejected: () => void
  onContactUpdated: (contact: SharedContact) => void
  onTransactionCallApproved: (tx: Transaction) => Promise<{ hash?: string }>
  onMessageCallApproved: () => Promise<{ hash?: string }>
  setEventHandled: (handled: boolean) => void
  pendingDeepLink: DeepLink | undefined
  setPendingDeepLink: Dispatch<DeepLink>
  onCallRejected: (message?: string) => void
}

export type CoreWebAccount = {
  index: number
  active: boolean
  addressC: string
  addressBTC?: string
  name: string
}
