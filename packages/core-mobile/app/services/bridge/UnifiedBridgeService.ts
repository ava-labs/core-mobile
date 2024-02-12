import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  BridgeAsset,
  ChainAssetMap,
  Chain,
  TokenType
} from '@avalabs/bridge-unified'
import { Network } from '@avalabs/chains-sdk'
import { ethErrors } from 'eth-rpc-errors'
import { JsonRpcApiProvider, TransactionRequest } from 'ethers'
import { chainIdToCaip } from 'utils/data/caip'
import { Account } from 'store/account/types'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { noop } from '@avalabs/utils-sdk'
import { NetworkTokenUnit } from 'types'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

export class UnifiedBridgeService {
  #service: BridgeService | undefined

  // init and fetch configs
  async init({
    environment,
    disabledBridgeTypes
  }: {
    environment: Environment
    disabledBridgeTypes: BridgeType[]
  }): Promise<void> {
    Logger.info('initializing unified bridge service', {
      environment,
      disabledBridgeTypes
    })

    this.service = createUnifiedBridgeService({
      environment,
      disabledBridgeTypes
    })

    await this.service.init()
  }

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  getBridgeAddresses(): string[] {
    const addresses: string[] = []

    this.service.bridges.forEach(bridge => {
      if (bridge.config) {
        addresses.push(
          ...bridge.config.map(
            ({ tokenRouterAddress }) => tokenRouterAddress as string
          )
        )
      }
    })

    return addresses
  }

  async getAssets(): Promise<ChainAssetMap> {
    return this.service.getAssets()
  }

  async getFee({
    asset,
    amount,
    sourceNetwork,
    targetNetwork
  }: {
    asset: BridgeAsset
    amount: bigint
    sourceNetwork: Network
    targetNetwork: Network
  }): Promise<bigint> {
    const feeMap = await this.service.getFees({
      asset,
      amount,
      targetChain: await this.buildChain(targetNetwork),
      sourceChain: await this.buildChain(sourceNetwork)
    })

    const fee = asset.address && feeMap[asset.address]

    if (!fee) {
      throw ethErrors.rpc.invalidRequest({
        data: {
          reason: 'invalid fee'
        }
      })
    }

    return fee
  }

  async transfer({
    asset,
    amount,
    targetNetwork,
    activeNetwork,
    activeAccount,
    updateListener
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    activeNetwork: Network
    activeAccount: Account
    updateListener: (transfer: BridgeTransfer) => void
  }): Promise<BridgeTransfer> {
    if (isBitcoinNetwork(activeNetwork)) {
      throw ethErrors.rpc.invalidParams({
        data: {
          reason: 'unsupported network'
        }
      })
    }

    const sourceChain = await this.buildChain(activeNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    const provider = NetworkService.getProviderForNetwork(
      activeNetwork
    ) as JsonRpcApiProvider

    const bridgeTransfer = await this.service.transferAsset({
      asset,
      fromAddress: activeAccount.address,
      amount,
      sourceChain,
      targetChain,
      onStepChange: noop, // this is not needed since we don't show multiple approvals like extension does
      sign: async ({ from, to, data }) => {
        const nonce = await provider.getTransactionCount(from)

        const gasLimit = await NetworkFeeService.estimateGasLimit({
          from,
          to: to as string,
          data: data as string,
          network: activeNetwork
        })

        const feeData = await NetworkFeeService.getNetworkFee(
          activeNetwork,
          NetworkTokenUnit.getConstructor(activeNetwork)
        )

        const txData: TransactionRequest = {
          from,
          to,
          data,
          chainId: activeNetwork.chainId,
          gasLimit,
          maxFeePerGas: feeData?.low.maxFeePerGas.toSubUnit() ?? 0n,
          maxPriorityFeePerGas:
            feeData?.low.maxPriorityFeePerGas?.toSubUnit() ?? 0n,
          nonce
        }

        const result = await WalletService.sign(
          txData,
          activeAccount.index,
          activeNetwork
        )

        return (await NetworkService.sendTransaction(
          result,
          activeNetwork
        )) as `0x${string}`
      }
    })

    this.trackTransfer(bridgeTransfer, updateListener)

    return bridgeTransfer
  }

  trackTransfer(
    bridgeTransfer: BridgeTransfer,
    updateListener: (transfer: BridgeTransfer) => void
  ): void {
    this.service.trackTransfer({
      bridgeTransfer,
      updateListener
    })
  }

  private async buildChain(network: Network): Promise<Chain> {
    return {
      chainId: chainIdToCaip(network.chainId),
      chainName: network.chainName,
      rpcUrl: network.rpcUrl,
      networkToken: {
        ...network.networkToken,
        type: TokenType.NATIVE
      },
      utilityAddresses: {
        multicall: network.utilityAddresses?.multicall as `0x${string}`
      }
    }
  }

  private get service(): BridgeService {
    assertNotUndefined(this.#service, 'brige service is not initialized')
    return this.#service
  }

  private set service(service: BridgeService) {
    this.#service = service
  }
}

export default new UnifiedBridgeService()
