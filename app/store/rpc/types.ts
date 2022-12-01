import { AvalancheGetAccountsRpcRequest } from './handlers/avalanche_getAccounts'
import { AvalancheGetContactsRpcRequest } from './handlers/avalanche_getContacts'
import { AvalancheUpdateContactRequest } from './handlers/avalanche_updateContact'
import { EthSendTransactionRpcRequest } from './handlers/eth_sendTransaction'
import { EthSignRpcRequest } from './handlers/eth_sign'
import { SessionRequestRpcRequest } from './handlers/session_request'
import { WalletAddEthereumChainRpcRequest } from './handlers/wallet_addEthereumChain'
import { WalletSwitchEthereumChainRpcRequest } from './handlers/wallet_switchEthereumChain'

export type DappRpcRequests =
  | AvalancheGetAccountsRpcRequest
  | AvalancheGetContactsRpcRequest
  | SessionRequestRpcRequest
  | AvalancheUpdateContactRequest
  | EthSendTransactionRpcRequest
  | EthSignRpcRequest
  | WalletAddEthereumChainRpcRequest
  | WalletSwitchEthereumChainRpcRequest

export type RpcState = {
  requests: DappRpcRequests[]
}
