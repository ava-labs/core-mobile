import {
  AppConfig,
  Asset,
  Blockchain,
  EthereumConfigAsset,
  NativeAsset,
  transferAsset as transferAssetSDK
} from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { TransactionResponse } from '@ethersproject/providers'
import { Account } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import { blockchainToNetwork } from 'screens/bridge/utils/bridgeUtils'
import { Network } from '@avalabs/chains-sdk'
import {
  getAvalancheProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { noop } from '@avalabs/utils-sdk'
import { Networks } from 'store/network'

type TransferAssetParams = {
  currentBlockchain: Blockchain
  amount: Big
  asset: Asset
  config: AppConfig | undefined
  activeAccount: Account | undefined
  allNetworks: Networks
  activeNetwork: Network
}

// TODO: CP-4150 refactor the remaining bridge logic into this service and redux
export class BridgeService {
  async transferAsset({
    currentBlockchain,
    amount,
    asset,
    config,
    activeAccount,
    allNetworks,
    activeNetwork
  }: TransferAssetParams): Promise<TransactionResponse | undefined> {
    if (!config) {
      throw new Error('missing bridge config')
    }
    if (!activeAccount) {
      throw new Error('no active account found')
    }

    const blockchainNetwork = blockchainToNetwork(
      currentBlockchain,
      allNetworks,
      config
    )

    if (!blockchainNetwork) {
      throw new Error('no network found')
    }

    const avalancheProvider = await getAvalancheProvider(
      allNetworks,
      activeNetwork.isTestnet
    )

    const ethereumProvider = await getEthereumProvider(
      allNetworks,
      activeNetwork.isTestnet
    )

    if (!avalancheProvider || !ethereumProvider) {
      throw new Error('no providers available')
    }

    return await transferAssetSDK(
      currentBlockchain,
      amount,
      activeAccount.address,
      asset as EthereumConfigAsset | NativeAsset, // TODO fix in sdk (should be Asset),
      avalancheProvider,
      ethereumProvider,
      config,
      noop,
      noop,
      txData =>
        WalletService.sign(txData, activeAccount.index, blockchainNetwork)
    )
  }
}

export default new BridgeService()
