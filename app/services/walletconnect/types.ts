import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { IClientMeta } from '@walletconnect/types'

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

export interface GenericAction {
  id?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  displayData: any
  method: string
  site: PeerMeta
}

export enum RpcMethod {
  SESSION_REQUEST = 'session_request',
  ETH_SEND_TRANSACTION = 'eth_sendTransaction',
  SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign',
  WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',
  WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
  WALLET_WATCH_ASSET = 'wallet_watchAsset',

  /* custom methods that are proprietary to Core */
  AVALANCHE_BRIDGE_ASSET = 'avalanche_bridgeAsset',
  AVALANCHE_CREATE_CONTACT = 'avalanche_createContact',
  AVALANCHE_GET_ACCOUNTS = 'avalanche_getAccounts',
  AVALANCHE_GET_BRIDGE_STATE = 'avalanche_getBridgeState',
  AVALANCHE_GET_CONTACTS = 'avalanche_getContacts',
  AVALANCHE_REMOVE_CONTACT = 'avalanche_removeContact',
  AVALANCHE_SELECT_ACCOUNT = 'avalanche_selectAccount',
  AVALANCHE_SET_DEVELOPER_MODE = 'avalanche_setDeveloperMode',
  AVALANCHE_UPDATE_CONTACT = 'avalanche_updateContact'
}

export type PeerMeta = IClientMeta | null | undefined

export type CallRequestData = {
  payload: JsonRpcRequest
  peerMeta: PeerMeta
}

export type SessionRequestData = {
  peerId: string
  peerMeta: PeerMeta
  chainId: string | null | undefined
  autoSign: boolean
  requestOriginatedFrom: string | undefined
}

export const CORE_ONLY_METHODS = [
  RpcMethod.AVALANCHE_BRIDGE_ASSET,
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_GET_BRIDGE_STATE,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
  RpcMethod.AVALANCHE_UPDATE_CONTACT
]
