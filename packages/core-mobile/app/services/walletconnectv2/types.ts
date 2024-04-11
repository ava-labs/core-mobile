import { SignClientTypes, SessionTypes } from '@walletconnect/types'

export const CORE_MOBILE_WALLET_ID = 'c3de833a-9cb0-4274-bb52-86e402ecfcd3'

export const CLIENT_METADATA = {
  name: 'Core',
  description: 'Core Mobile',
  url: 'https://www.avax.network',
  icons: [
    'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
  ],
  walletId: CORE_MOBILE_WALLET_ID // core web depends on this id to distinguish core mobile from other wallets
}

export type Session = SessionTypes.Struct

export type PeerMeta = {
  name: string
  description: string
  url: string
  icons: string[]
}

export type SessionProposalData =
  SignClientTypes.EventArguments['session_proposal']

export type SessionRequestData =
  SignClientTypes.EventArguments['session_request']

export type WalletConnectCallbacks = {
  onSessionProposal: (data: SessionProposalData) => void
  onSessionRequest: (data: SessionRequestData, peerMeta: PeerMeta) => void
  onDisconnect: (data: PeerMeta) => void
}
