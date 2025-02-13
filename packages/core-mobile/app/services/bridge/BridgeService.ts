import {
  AppConfig,
  Asset,
  Blockchain,
  BridgeConfig,
  Environment,
  fetchConfig,
  setBridgeEnvironment,
  transferAssetBTC,
  TransferAssetBTCParams,
  transferAssetEVM,
  TransferAssetEVMParams,
  WrapStatus
} from '@avalabs/core-bridge-sdk'
import { Account } from 'store/account/types'
import {
  getAvalancheEvmProvider,
  getEthereumProvider
} from 'services/network/utils/providerUtils'
import { Networks } from 'store/network/types'
import { blockchainToNetwork } from 'screens/bridge/utils/bridgeUtils'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { bnToBig, noop, stringToBN } from '@avalabs/core-utils-sdk'
import { transactionRequestToTransactionParams } from 'store/rpc/utils/transactionRequestToTransactionParams'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { RpcMethod } from '@avalabs/vm-module-types'

type TransferBTCParams = {
  fromAccount: string
  amount: number
  feeRate: number
  config: AppConfig
  isMainnet: boolean
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

  async transferBTC({
    fromAccount,
    amount,
    config,
    feeRate,
    isMainnet,
    onStatusChange,
    onTxHashChange,
    request
  }: TransferBTCParams): Promise<string> {
    const signAndSendBTC: TransferAssetBTCParams['signAndSendBTC'] =
      async txData => {
        return request({
          method: RpcMethod.BITCOIN_SEND_TRANSACTION,
          params: txData,
          chainId: getBitcoinCaip2ChainId(isMainnet)
        })
      }

    return transferAssetBTC({
      fromAccount,
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

    const avalancheProvider = await getAvalancheEvmProvider(
      allNetworks,
      isTestnet
    )

    const ethereumProvider = await getEthereumProvider(allNetworks, isTestnet)

    if (!avalancheProvider || !ethereumProvider) {
      throw new Error('No providers available')
    }

    const signAndSendEVM: TransferAssetEVMParams['signAndSendEVM'] =
      async txRequest => {
        const txParams = transactionRequestToTransactionParams(txRequest)

        return request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [txParams],
          chainId: getEvmCaip2ChainId(blockchainNetwork.chainId)
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
