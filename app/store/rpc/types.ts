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

export type RpcState = {
  requests: DappRpcRequests[]
  approvedDApps: ApprovedAppMeta[]
}
