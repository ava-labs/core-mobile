import { avalancheGetAccountsHandler } from './avalanche_getAccounts'
import { avalancheGetContactsHandler } from './avalanche_getContacts'
import { avalancheUpdateContactHandler } from './avalanche_updateContact'
import { avalancheCreateContactHandler } from './avalanche_createContact'
import { avalancheRemoveContactHandler } from './avalanche_removeContact'
import { ethSendTransactionHandler } from './eth_sendTransaction'
import { ethSignHandler } from './eth_sign'
import { sessionRequestHandler } from './session_request'
import { walletAddEthereumChainHandler } from './wallet_addEthereumChain'
import { walletSwitchEthereumChainHandler } from './wallet_switchEthereumChain'
import { avalancheBridgeAssetHandler } from './avalanche_bridgeAsset'
import { avalancheSelectAccountHandler } from './avalanche_selectAccount'

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
  walletSwitchEthereumChainHandler
].reduce((acc, current) => {
  current.methods.forEach(method => {
    acc.set(method, current)
  })
  return acc
}, new Map())

export default handlerMap
