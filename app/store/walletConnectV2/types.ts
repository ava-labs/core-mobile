import { SignClientTypes } from '@walletconnect/types'
import { EthereumProviderError, EthereumRpcError } from 'eth-rpc-errors'
import { Session, SessionProposalData } from 'services/walletconnectv2/types'

export type SessionProposal = {
  data: SessionProposalData
  method: RpcMethod.SESSION_REQUEST
}

export type SessionRequest<Method> = {
  data: SignClientTypes.BaseEventArgs<{
    request: {
      method: Method
      params: unknown
    }
    chainId: string
  }>
  method: Method
  session: Session
}

export type Request = SessionProposal | SessionRequest<string>

export type WalletConnectState = {
  requestStatuses: Record<string, { result?: unknown; error?: Error }>
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

export type RpcError = EthereumRpcError<string> | EthereumProviderError<string>

export enum WalletConnectVersions {
  V1 = '1',
  V2 = '2'
}
