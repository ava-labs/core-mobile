import { avalancheGetAccountsHandler } from './account/avalanche_getAccounts/avalanche_getAccounts'
import { avalancheGetContactsHandler } from './contact/avalanche_getContacts'
import { avalancheUpdateContactHandler } from './contact/avalanche_updateContact/avalanche_updateContact'
import { avalancheCreateContactHandler } from './contact/avalanche_createContact/avalanche_createContact'
import { avalancheRemoveContactHandler } from './contact/avalanche_removeContact/avalanche_removeContact'
import { ethSendTransactionHandler } from './eth_sendTransaction/eth_sendTransaction'
import { ethSignHandler } from './eth_sign/eth_sign'
import { sessionRequestHandler } from './session_request/session_request'
import { walletAddEthereumChainHandler } from './chain/wallet_addEthereumChain/wallet_addEthereumChain'
import { walletSwitchEthereumChainHandler } from './chain/wallet_switchEthereumChain/wallet_switchEthereumChain'
import { avalancheBridgeAssetHandler } from './avalanche_bridgeAsset/avalanche_bridgeAsset'
import { avalancheSelectAccountHandler } from './account/avalanche_selectAccount/avalanche_selectAccount'
import { RpcRequestHandler } from './types'
import { avalancheSendTransactionHandler } from './avalanche_sendTransaction/avalanche_sendTransaction'
import { avalancheGetAccountPubKeyHandler } from './avalanche_getAccountPubKey/avalanche_getAccountPubKey'
import { avalancheSignTransactionHandler } from './avalanche_signTransaction/avalanche_signTransaction'

const handlerMap = [
  avalancheSelectAccountHandler,
  avalancheBridgeAssetHandler,
  avalancheCreateContactHandler,
  avalancheRemoveContactHandler,
  avalancheUpdateContactHandler,
  avalancheGetAccountsHandler,
  avalancheGetContactsHandler,
  ethSendTransactionHandler,
  ethSignHandler,
  sessionRequestHandler,
  walletAddEthereumChainHandler,
  walletSwitchEthereumChainHandler,
  avalancheSendTransactionHandler,
  avalancheSignTransactionHandler,
  avalancheGetAccountPubKeyHandler
].reduce((acc, current) => {
  current.methods.forEach(method => {
    acc.set(method, current)
  })
  return acc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, new Map<string, RpcRequestHandler<any, any, any, any>>())

export default handlerMap
