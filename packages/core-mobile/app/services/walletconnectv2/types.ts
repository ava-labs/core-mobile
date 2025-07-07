import {
  SignClientTypes,
  SessionTypes,
  EngineTypes
} from '@walletconnect/types'
import { PeerMeta } from 'store/rpc/types'
import { RpcError } from '@avalabs/vm-module-types'
import { CorePrimaryAccount } from 'store/account/types'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'

export const CORE_MOBILE_WALLET_ID = 'c3de833a-9cb0-4274-bb52-86e402ecfcd3'

export const CLIENT_METADATA = {
  name: 'Core',
  description: 'Core Mobile',
  url: 'https://www.avax.network',
  icons: [
    'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
  ],
  walletId: CORE_MOBILE_WALLET_ID, // core web depends on this id to distinguish core mobile from other wallets
  appVersion: DeviceInfoService.getAppVersion()
}

export type Session = SessionTypes.Struct

export type SessionProposalData =
  SignClientTypes.EventArguments['session_proposal']

export type SessionRequestData =
  SignClientTypes.EventArguments['session_request']

export type WalletConnectCallbacks = {
  onSessionProposal: (data: SessionProposalData) => void
  onSessionRequest: (data: SessionRequestData, peerMeta: PeerMeta) => void
  onDisconnect: (data: PeerMeta) => void
}

export interface WalletConnectServiceInterface {
  init(callbacks: WalletConnectCallbacks): Promise<void>

  pair(uri: string): Promise<void>

  getSessions(): SessionTypes.Struct[]

  getSession(topic: string): SessionTypes.Struct | undefined

  approveSession({
    id,
    relayProtocol,
    namespaces
  }: Pick<
    EngineTypes.ApproveParams,
    'id' | 'relayProtocol' | 'namespaces'
  >): Promise<SessionTypes.Struct>

  rejectSession(id: number): Promise<void>

  approveRequest(
    topic: string,
    requestId: number,
    result: unknown,
  ): Promise<void>

  rejectRequest(
    topic: string,
    requestId: number,
    error: RpcError
  ): Promise<void>

  killSession(topic: string): Promise<void>

  killAllSessions(): Promise<void>

  killSessions(topics: string[]): void

  updateSession({
    session,
    chainId,
    account
  }: {
    session: SessionTypes.Struct
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void>

  updateSessionWithTimeout({
    session,
    chainId,
    account
  }: {
    session: SessionTypes.Struct
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void>

  updateSessions({
    chainId,
    account
  }: {
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void>

  updateSessionWithTimeoutForNonEvm({
    session,
    account,
    isTestnet
  }: {
    session: SessionTypes.Struct
    account: CorePrimaryAccount
    isTestnet?: boolean
  }): Promise<void>
}
