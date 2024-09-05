import { avalancheGetAccountsHandler } from './account/avalanche_getAccounts/avalanche_getAccounts'
import { avalancheGetContactsHandler } from './contact/avalanche_getContacts'
import { avalancheUpdateContactHandler } from './contact/avalanche_updateContact/avalanche_updateContact'
import { avalancheCreateContactHandler } from './contact/avalanche_createContact/avalanche_createContact'
import { avalancheRemoveContactHandler } from './contact/avalanche_removeContact/avalanche_removeContact'
import { wcSessionRequestHandler } from './wc_sessionRequest/wc_sessionRequest'
import { walletAddEthereumChainHandler } from './chain/wallet_addEthereumChain/wallet_addEthereumChain'
import { walletSwitchEthereumChainHandler } from './chain/wallet_switchEthereumChain/wallet_switchEthereumChain'
import { avalancheBridgeAssetHandler } from './avalanche_bridgeAsset/avalanche_bridgeAsset'
import { avalancheSelectAccountHandler } from './account/avalanche_selectAccount/avalanche_selectAccount'
import { RpcRequestHandler } from './types'
import { avalancheGetAccountPubKeyHandler } from './avalanche_getAccountPubKey/avalanche_getAccountPubKey'
import { avalancheSetDeveloperModeHandler } from './avalanche_setDeveloperMode/avalanche_setDeveloperMode'
import { walletGetEthereumChainHandler } from './chain/wallet_getEthereumChain/wallet_getEthereumChain'
import { avalancheGetAddressesInRangeHandler } from './avalanche_getAddressesInRange/avalanche_getAddressesInRange'
import { avalancheRenameAccountHandler } from './account/avalanche_renameAccount/avalanche_renameAccount'

const handlerMap = [
  avalancheSelectAccountHandler,
  avalancheBridgeAssetHandler,
  avalancheCreateContactHandler,
  avalancheRemoveContactHandler,
  avalancheUpdateContactHandler,
  avalancheGetAccountsHandler,
  avalancheGetContactsHandler,
  wcSessionRequestHandler,
  walletAddEthereumChainHandler,
  walletSwitchEthereumChainHandler,
  walletGetEthereumChainHandler,
  avalancheGetAccountPubKeyHandler,
  avalancheSetDeveloperModeHandler,
  avalancheGetAddressesInRangeHandler,
  avalancheRenameAccountHandler
].reduce((acc, current) => {
  if (current?.methods === undefined) return acc

  current.methods.forEach(method => {
    acc.set(method, current)
  })
  return acc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, new Map<string, RpcRequestHandler<any, any, any, any>>())

export default handlerMap
