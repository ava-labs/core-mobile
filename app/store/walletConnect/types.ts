import { IWalletConnectSession } from '@walletconnect/types'
import { AvalancheBridgeAssetRequest } from './handlers/avalanche_bridgeAsset'
import { AvalancheCreateContactRequest } from './handlers/avalanche_createContact'
import { AvalancheGetAccountsRpcRequest } from './handlers/avalanche_getAccounts'
import { AvalancheGetContactsRpcRequest } from './handlers/avalanche_getContacts'
import { AvalancheRemoveContactRequest } from './handlers/avalanche_removeContact'
import { AvalancheSelectAccountRequest } from './handlers/avalanche_selectAccount'
import { AvalancheUpdateContactRequest } from './handlers/avalanche_updateContact'
import { EthSendTransactionRpcRequest } from './handlers/eth_sendTransaction'
import { EthSignRpcRequest } from './handlers/eth_sign'
import { SessionRequestRpcRequest } from './handlers/session_request'
import { WalletAddEthereumChainRpcRequest } from './handlers/wallet_addEthereumChain'
import { WalletSwitchEthereumChainRpcRequest } from './handlers/wallet_switchEthereumChain'

export type ApprovedAppMeta = IWalletConnectSession & { uri: string }

export type DappRpcRequests =
  | AvalancheGetAccountsRpcRequest
  | AvalancheGetContactsRpcRequest
  | SessionRequestRpcRequest
  | AvalancheUpdateContactRequest
  | EthSendTransactionRpcRequest
  | EthSignRpcRequest
  | WalletAddEthereumChainRpcRequest
  | WalletSwitchEthereumChainRpcRequest
  | AvalancheCreateContactRequest
  | AvalancheRemoveContactRequest
  | AvalancheBridgeAssetRequest
  | AvalancheSelectAccountRequest

export type WalletConnectState = {
  requests: DappRpcRequests[]
  approvedDApps: ApprovedAppMeta[]
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
