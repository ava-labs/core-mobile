import { PeerMetadata } from 'screens/rpc/util/types'

export const CLIENT_OPTIONS = {
  clientMeta: {
    // Required
    description: 'Core Mobile',
    url: 'https://www.avax.network',
    icons: [
      'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
    ],
    name: 'Core',
    ssl: !__DEV__
  }
}

export interface DeepLink {
  url: string
  origin: DeepLinkOrigin
}

export enum MessageType {
  ETH_SEND = 'eth_sendTransaction',
  SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign'
}

export enum DeepLinkOrigin {
  ORIGIN_DEEPLINK = 'deeplink',
  ORIGIN_QR_CODE = 'qr-code'
}

export enum WalletConnectRequest {
  SESSION = 'walletconnectSessionRequest',
  SESSION_APPROVED = 'walletconnectSessionRequest::approved',
  SESSION_REJECTED = 'walletconnectSessionRequest::rejected',
  CALL = 'walletconnectCallRequest',
  CALL_APPROVED = 'walletconnectCallRequest::approved',
  CALL_REJECTED = 'walletconnectCallRequest::rejected'
}

export const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
  WC: 'wc',
  ETHEREUM: 'ethereum',
  DAPP: 'dapp',
  METAMASK: 'metamask'
}

export const ACTIONS = {
  DAPP: 'dapp',
  SEND: 'send',
  APPROVE: 'approve',
  PAYMENT: 'payment',
  FOCUS: 'focus',
  EMPTY: '',
  WC: 'wc'
}

export const PREFIXES = {
  [ACTIONS.DAPP]: 'https://',
  [ACTIONS.SEND]: 'ethereum:',
  [ACTIONS.APPROVE]: 'ethereum:',
  [ACTIONS.FOCUS]: '',
  [ACTIONS.EMPTY]: ''
}

export interface MessageAction {
  id?: string | number
  result?: any
  error?: string
  displayData: any
  method: string
  site: PeerMetadata
}
