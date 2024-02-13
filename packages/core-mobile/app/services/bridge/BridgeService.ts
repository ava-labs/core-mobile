import {
  AppConfig,
  Asset,
  Blockchain,
  Environment,
  EthereumConfigAsset,
  fetchConfig,
  NativeAsset,
  setBridgeEnvironment,
  transferAsset as transferAssetSDK
} from '@avalabs/bridge-sdk'
import Big from 'big.js'
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
import { TransactionResponse } from 'ethers'
import { omit } from 'lodash'

type TransferAssetParams = {
  currentBlockchain: Blockchain
  amount: Big
  asset: Asset
  config: AppConfig | undefined
  activeAccount: Account | undefined
  allNetworks: Networks
  isTestnet: boolean
  maxFeePerGas?: bigint
}

export class BridgeService {
  async getConfig(activeNetwork: Network) {
    setBridgeEnvironment(
      activeNetwork.isTestnet ? Environment.TEST : Environment.PROD
    )
    return fetchConfig()
  }

  async transferAsset({
    currentBlockchain,
    amount,
    asset,
    config,
    activeAccount,
    allNetworks,
    isTestnet,
    maxFeePerGas
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

    const avalancheProvider = await getAvalancheProvider(allNetworks, isTestnet)

    const ethereumProvider = await getEthereumProvider(allNetworks, isTestnet)

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
      txData => {
        const tx = {
          ...omit(txData, 'gasPrice'),
          maxFeePerGas
        }
        return WalletService.sign(tx, activeAccount.index, blockchainNetwork)
      }
    )
  }
}

export default new BridgeService()
