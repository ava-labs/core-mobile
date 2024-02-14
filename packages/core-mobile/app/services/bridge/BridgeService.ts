import {
  AppConfig,
  Asset,
  BitcoinConfigAsset,
  Blockchain,
  BridgeConfig,
  btcToSatoshi,
  Environment,
  estimateGas,
  EthereumConfigAsset,
  fetchConfig,
  getBtcTransaction,
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
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { omit } from 'lodash'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'

type TransferAssetParams = {
  currentBlockchain: Blockchain
  amount: Big
  asset: Asset
  config: AppConfig | undefined
  activeAccount: Account | undefined
  allNetworks: Networks
  isTestnet: boolean
  maxFeePerGas: bigint
  maxPriorityFeePerGas?: bigint
}

export class BridgeService {
  async getConfig(activeNetwork: Network): Promise<BridgeConfig> {
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
    maxFeePerGas,
    maxPriorityFeePerGas
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
          maxFeePerGas,
          maxPriorityFeePerGas
        }
        return WalletService.sign(tx, activeAccount.index, blockchainNetwork)
      }
    )
  }

  async estimateGas({
    currentBlockchain,
    amount,
    asset,
    allNetworks,
    isTestnet,
    config,
    activeNetwork,
    activeAccount,
    currency
  }: {
    currentBlockchain: Blockchain
    amount: Big
    asset: Asset
    allNetworks: Networks
    isTestnet: boolean
    activeNetwork: Network
    activeAccount?: Account
    config?: AppConfig
    currency: string
  }): Promise<bigint | undefined> {
    if (!config) {
      throw new Error('missing bridge config')
    }
    if (!activeAccount) {
      throw new Error('no active account found')
    }

    if (currentBlockchain === Blockchain.BITCOIN) {
      const token = await getBtcBalance(
        !activeNetwork.isTestnet,
        activeAccount?.addressBtc,
        currency
      )

      // Bitcoin's formula for fee is `transactionByteLength * feeRate`.
      // By setting the feeRate here to 1, we'll receive the transaction's byte length,
      // which is what we need to have the dynamic fee calculations in the UI.
      // Think of the byteLength as gasLimit for EVM transactions.
      const feeRate = 1
      const { fee: byteLength } = getBtcTransaction(
        config,
        activeAccount.addressBtc,
        token?.utxos ?? [],
        btcToSatoshi(amount),
        feeRate
      )

      return BigInt(byteLength)
    } else {
      const avalancheProvider = getAvalancheProvider(allNetworks, isTestnet)
      const ethereumProvider = getEthereumProvider(allNetworks, isTestnet)

      if (!avalancheProvider || !ethereumProvider) {
        throw new Error('no providers available')
      }

      return estimateGas(
        amount,
        activeAccount.address,
        asset as Exclude<Asset, BitcoinConfigAsset>,
        {
          ethereum: ethereumProvider,
          avalanche: avalancheProvider
        },
        config,
        currentBlockchain
      )
    }
  }
}

export default new BridgeService()
