import { PeerMetadata } from 'screens/rpc/util/types'

const CORE_MOBILE_WALLET_ID = 'c3de833a-9cb0-4274-bb52-86e402ecfcd3'

export const CLIENT_OPTIONS = {
  clientMeta: {
    // Required
    description: 'Core Mobile',
    url: 'https://www.avax.network',
    icons: [
      'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
    ],
    name: 'Core',
    ssl: !__DEV__,
    walletId: CORE_MOBILE_WALLET_ID // core web depends on this id to distinguish core mobile from other wallets
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
  SESSION_DISCONNECTED = 'walletconnectSessionDisconnected',
  CALL = 'walletconnectCallRequest',
  CALL_APPROVED = 'walletconnectCallRequest::approved',
  CALL_REJECTED = 'walletconnectCallRequest::rejected'
}

export const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
  WC: 'wc'
}

export const ACTIONS = {
  WC: 'wc'
}

export interface MessageAction {
  id?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any
  error?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  displayData: any
  method: string
  site: PeerMetadata
}
