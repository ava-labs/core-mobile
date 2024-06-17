import { EthereumProviderError, EthereumRpcError } from 'eth-rpc-errors'
import { v4 as uuidv4 } from 'uuid'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { AppListenerEffectAPI } from 'store'

export interface PeerMeta {
  name: string
  description: string
  url: string
  icons: string[]
}

export type RpcRequest<Method extends RpcMethod> = {
  data: {
    id: number
    topic: string
    params: {
      request: {
        method: Method
        params: unknown
      }
      chainId: string
    }
  }
  method: Method
  peerMeta: PeerMeta
  provider: RpcProvider
}

export type Request = RpcRequest<RpcMethod> | WCSessionProposal

export type RpcState = {
  requestStatuses: Record<string, RequestStatus>
}

export enum RpcMethod {
  /* standard methods */
  ETH_SEND_TRANSACTION = 'eth_sendTransaction',
  SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign',
  WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',
  WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
  WALLET_GET_ETHEREUM_CHAIN = 'wallet_getEthereumChain',

  /* custom methods that are proprietary to Core */
  AVALANCHE_BRIDGE_ASSET = 'avalanche_bridgeAsset',
  AVALANCHE_CREATE_CONTACT = 'avalanche_createContact',
  AVALANCHE_GET_ACCOUNTS = 'avalanche_getAccounts',
  AVALANCHE_GET_ACCOUNT_PUB_KEY = 'avalanche_getAccountPubKey',
  AVALANCHE_GET_BRIDGE_STATE = 'avalanche_getBridgeState',
  AVALANCHE_GET_CONTACTS = 'avalanche_getContacts',
  AVALANCHE_REMOVE_CONTACT = 'avalanche_removeContact',
  AVALANCHE_SELECT_ACCOUNT = 'avalanche_selectAccount',
  AVALANCHE_SET_DEVELOPER_MODE = 'avalanche_setDeveloperMode',
  AVALANCHE_UPDATE_CONTACT = 'avalanche_updateContact',
  AVALANCHE_SEND_TRANSACTION = 'avalanche_sendTransaction',
  AVALANCHE_SIGN_TRANSACTION = 'avalanche_signTransaction',
  AVALANCHE_GET_ADDRESSES_IN_RANGE = 'avalanche_getAddressesInRange',
  BITCOIN_SEND_TRANSACTION = 'bitcoin_sendTransaction',
  AVALANCHE_SIGN_MESSAGE = 'avalanche_signMessage',

  /* custom methods that only apply to Wallet Connect*/
  WC_SESSION_REQUEST = 'wc_sessionRequest',

  /* custom methods that only apply to in-app */
  GET_TRANSACTION_HISTORY = 'getTransactionHistory'
}

export const CORE_ONLY_METHODS = [
  RpcMethod.AVALANCHE_BRIDGE_ASSET,
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_GET_BRIDGE_STATE,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
  RpcMethod.AVALANCHE_UPDATE_CONTACT,
  RpcMethod.AVALANCHE_SEND_TRANSACTION,
  RpcMethod.AVALANCHE_SIGN_TRANSACTION,
  RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
  RpcMethod.BITCOIN_SEND_TRANSACTION,
  RpcMethod.AVALANCHE_SIGN_MESSAGE,
  RpcMethod.GET_TRANSACTION_HISTORY
]

export type RpcError = EthereumRpcError<string> | EthereumProviderError<string>

export type ConfirmationReceiptStatus = 'Reverted' | 'Success' | 'Pending'

export type RequestStatus = {
  result?: {
    txHash: string
    confirmationReceiptStatus?: ConfirmationReceiptStatus
  }
  error?: Error
}

export enum RpcProvider {
  WALLET_CONNECT = 'wallet_connect',
  CORE_MOBILE = 'core_mobile'
}

export interface AgnosticRpcProvider {
  provider: RpcProvider
  onError: ({
    request,
    error,
    listenerApi
  }: {
    request: Request
    error: RpcError
    listenerApi: AppListenerEffectAPI
  }) => Promise<void>
  onSuccess: ({
    request,
    result,
    listenerApi
  }: {
    request: Request
    result: unknown
    listenerApi: AppListenerEffectAPI
  }) => Promise<void>
  validateRequest: (request: Request, listenerApi: AppListenerEffectAPI) => void
}

// this is the session id for all Core Mobile in-app requests
// it stays the same during an app session
export const CORE_MOBILE_TOPIC = uuidv4()

export const CORE_MOBILE_META: PeerMeta = {
  name: 'Core',
  description: 'Core Mobile Wallet',
  url: 'https://core.app/',
  icons: []
}

export const EVM_IDENTIFIER = 'eip155'
