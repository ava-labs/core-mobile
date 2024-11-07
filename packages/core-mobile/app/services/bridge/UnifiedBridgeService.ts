import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  ChainAssetMap,
  getEnabledBridgeServices,
  EvmSigner,
  BtcSigner,
  EvmBridgeInitializer,
  AvaToBtcBridgeInitializer,
  BtcToAvaBridgeInitializer,
  Hex,
  BridgeAsset,
  Chain,
  TokenType,
  isNativeAsset,
  isErc20Asset
} from '@avalabs/bridge-unified'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { Network } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { noop } from '@avalabs/core-utils-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import { AppListenerEffectAPI } from 'store'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'temp/caip2ChainIds'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

export class UnifiedBridgeService {
  #service: BridgeService | undefined

  // init and fetch configs
  async init({
    isTest,
    disabledBridgeTypes,
    listenerApi
  }: {
    isTest: boolean
    disabledBridgeTypes: BridgeType[]
    listenerApi: AppListenerEffectAPI
  }): Promise<void> {
    const environment = isTest ? Environment.TEST : Environment.PROD
    const request = createInAppRequest(listenerApi.dispatch)

    Logger.info('initializing unified bridge service', {
      environment,
      disabledBridgeTypes
    })

    const bitcoinProvider = await getBitcoinProvider(isTest)

    const evmSigner: EvmSigner = {
      sign: async ({ data, from, to, chainId }) => {
        if (typeof to !== 'string') throw new Error('invalid to field')
        const txParams: [TransactionParams] = [
          {
            from,
            to,
            data: data ?? undefined
          }
        ]

        return request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: txParams,
          chainId: getEvmCaip2ChainId(Number(chainId))
        }) as Promise<Hex>
      }
    }

    const btcSigner: BtcSigner = {
      sign: async txData => {
        return request({
          method: RpcMethod.BITCOIN_SIGN_TRANSACTION,
          params: txData,
          chainId: getBitcoinCaip2ChainId(!isTest)
        })
      }
    }
    const cctpInitializer: EvmBridgeInitializer = {
      type: BridgeType.CCTP,
      signer: evmSigner
    }
    const icttErc20Initializer: EvmBridgeInitializer = {
      type: BridgeType.ICTT_ERC20_ERC20,
      signer: evmSigner
    }
    const avalancheEvmInitializer: EvmBridgeInitializer = {
      type: BridgeType.AVALANCHE_EVM,
      signer: evmSigner
    }
    const avalancheBtcInitializer: AvaToBtcBridgeInitializer = {
      type: BridgeType.AVALANCHE_AVA_BTC,
      signer: evmSigner,
      bitcoinFunctions: bitcoinProvider
    }
    const bitcoinAvaInitializer: BtcToAvaBridgeInitializer = {
      type: BridgeType.AVALANCHE_BTC_AVA,
      signer: btcSigner,
      bitcoinFunctions: bitcoinProvider
    }

    const enabledBridgeServices = await getEnabledBridgeServices(environment, [
      cctpInitializer,
      icttErc20Initializer,
      avalancheEvmInitializer,
      avalancheBtcInitializer,
      bitcoinAvaInitializer
    ])

    this.service = createUnifiedBridgeService({
      environment,
      enabledBridgeServices
    })
  }

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  getBridgeAddresses(): string[] {
    const addresses: string[] = []

    // this.service.bridges.forEach(bridge => {
    //   if (bridge.config) {
    //     addresses.push(
    //       ...bridge.config.map(
    //         ({ tokenRouterAddress }) => tokenRouterAddress as string
    //       )
    //     )
    //   }
    // })

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

    if (isNativeAsset(asset)) {
      // todo: handle this properly
      return 0n
    } else if (isErc20Asset(asset) && asset.address) {
      const address = asset.address.toLowerCase() as `0x${string}`
      return feeMap[address] ?? 0n
    } else {
      throw new Error('invalid asset')
    }
  }

  async transfer({
    asset,
    amount,
    targetNetwork,
    sourceNetwork,
    fromAddress,
    toAddress,
    updateListener
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    sourceNetwork: Network
    fromAddress: string
    toAddress: string
    updateListener: (transfer: BridgeTransfer) => void
  }): Promise<BridgeTransfer> {
    const sourceChain = await this.buildChain(sourceNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    const bridgeTransfer = await this.service.transferAsset({
      asset,
      fromAddress,
      toAddress,
      amount,
      sourceChain,
      targetChain,
      onStepChange: noop
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

  async estimateGas({
    asset,
    amount,
    fromAddress,
    sourceNetwork,
    targetNetwork
  }: {
    asset: BridgeAsset
    amount: bigint
    fromAddress: string
    sourceNetwork: Network
    targetNetwork?: Network
  }): Promise<bigint> {
    if (!targetNetwork) {
      throw new Error('no target network found')
    }

    const sourceChain = await this.buildChain(sourceNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    return await this.service.estimateGas({
      asset,
      fromAddress,
      amount,
      sourceChain,
      targetChain
    })
  }

  async getMinimumTransferAmount({
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
    const sourceChain = await this.buildChain(sourceNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    return this.service.getMinimumTransferAmount({
      asset,
      amount,
      sourceChain,
      targetChain
    })
  }

  private async buildChain(network: Network): Promise<Chain> {
    return {
      chainId: addNamespaceToChain(network.chainId),
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
