import {
  AppConfig,
  Asset,
  BitcoinConfigAsset,
  Blockchain,
  BridgeConfig,
  btcToSatoshi,
  Environment,
  estimateGas,
  fetchConfig,
  getBtcTransactionDetails,
  setBridgeEnvironment,
  transferAssetBTC,
  TransferAssetBTCParams,
  transferAssetEVM,
  TransferAssetEVMParams,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import Big from 'big.js'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/chains-sdk'
import {
  getAvalancheProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { Networks } from 'store/network/types'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { blockchainToNetwork } from 'screens/bridge/utils/bridgeUtils'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from 'store/rpc/types'
import { bnToBig, noop, stringToBN } from '@avalabs/utils-sdk'

type TransferBTCParams = {
  amount: string
  feeRate: number
  config: AppConfig
  onStatusChange?: (status: WrapStatus) => void
  onTxHashChange?: (txHash: string) => void
  request: Request
}

type TransferEVMParams = {
  currentBlockchain: Blockchain.AVALANCHE | Blockchain.ETHEREUM
  amount: string
  asset: Asset
  config: AppConfig
  activeAccount: Account
  allNetworks: Networks
  isTestnet: boolean
  onStatusChange?: (status: WrapStatus) => void
  onTxHashChange?: (txHash: string) => void
  request: Request
}

export class BridgeService {
  setBridgeEnvironment(isTestnet: boolean): void {
    setBridgeEnvironment(isTestnet ? Environment.TEST : Environment.PROD)
  }

  async getConfig(): Promise<BridgeConfig> {
    return fetchConfig()
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
      if (btcToSatoshi(amount) === 0) {
        throw new Error(`Amount can't be 0`)
      }
      const token = await getBtcBalance(
        !activeNetwork.isTestnet,
        activeAccount?.addressBTC,
        currency
      )

      // Bitcoin's formula for fee is `transactionByteLength * feeRate`.
      // By setting the feeRate here to 1, we'll receive the transaction's byte length,
      // which is what we need to have the dynamic fee calculations in the UI.
      // Think of the byteLength as gasLimit for EVM transactions.
      const feeRate = 1
      const { fee: byteLength } = getBtcTransactionDetails(
        config,
        activeAccount.addressBTC,
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
        activeAccount.addressC,
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

  async transferBTC({
    amount,
    config,
    feeRate,
    onStatusChange,
    onTxHashChange,
    request
  }: TransferBTCParams): Promise<string> {
    const signAndSendBTC: TransferAssetBTCParams['signAndSendBTC'] =
      async txData => {
        return request({
          method: RpcMethod.BITCOIN_SEND_TRANSACTION,
          params: txData
        })
      }

    return transferAssetBTC({
      amount,
      feeRate,
      config,
      onStatusChange: onStatusChange ?? noop,
      onTxHashChange: onTxHashChange ?? noop,
      signAndSendBTC
    })
  }

  async transferEVM({
    currentBlockchain,
    amount,
    asset,
    config,
    activeAccount,
    allNetworks,
    isTestnet,
    onStatusChange,
    onTxHashChange,
    request
  }: TransferEVMParams): Promise<string> {
    const blockchainNetwork = blockchainToNetwork(
      currentBlockchain,
      allNetworks,
      config
    )

    if (!blockchainNetwork) {
      throw new Error('Invalid blockchain')
    }

    const avalancheProvider = getAvalancheProvider(allNetworks, isTestnet)

    const ethereumProvider = getEthereumProvider(allNetworks, isTestnet)

    if (!avalancheProvider || !ethereumProvider) {
      throw new Error('No providers available')
    }

    const signAndSendEVM: TransferAssetEVMParams['signAndSendEVM'] =
      async txData => {
        if (typeof txData.gasLimit !== 'bigint')
          throw new Error('invalid gasLimit field')

        if (typeof txData.from !== 'string')
          throw new Error('invalid from field')

        if (typeof txData.to !== 'string') throw new Error('invalid to field')

        const txParams: [TransactionParams] = [
          {
            from: txData.from,
            to: txData.to,
            gas: bigIntToHex(txData.gasLimit),
            data: txData.data ?? undefined,
            value:
              typeof txData.value === 'bigint'
                ? bigIntToHex(txData.value)
                : undefined
          }
        ]

        return request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: txParams,
          chainId: blockchainNetwork.chainId
        })
      }

    const denomination = asset.denomination

    const amountBig = bnToBig(stringToBN(amount, denomination), denomination)

    return transferAssetEVM({
      currentBlockchain,
      amount: amountBig,
      account: activeAccount.addressC,
      asset: asset as Asset,
      avalancheProvider,
      ethereumProvider,
      config,
      onStatusChange: onStatusChange ?? noop,
      onTxHashChange: onTxHashChange ?? noop,
      signAndSendEVM
    })
  }
}

export default new BridgeService()
