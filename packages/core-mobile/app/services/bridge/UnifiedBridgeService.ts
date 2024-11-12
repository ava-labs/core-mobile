import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  ChainAssetMap,
  getEnabledBridgeServices,
  EvmSigner,
  BtcSigner,
  Hex,
  BridgeAsset,
  Chain,
  TokenType,
  isNativeAsset,
  isErc20Asset,
  AnalyzeTxResult,
  AnalyzeTxParams,
  BridgeInitializer
} from '@avalabs/bridge-unified'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { Network } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { noop } from '@avalabs/core-utils-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import { AppListenerEffectAPI, RootState } from 'store'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'temp/caip2ChainIds'
import { addNamespaceToChain } from 'services/walletconnectv2/utils'
import { BitcoinProvider } from '@avalabs/core-wallets-sdk'
import { selectIsFeatureBlocked } from 'store/posthog'
import { FeatureGates } from 'services/posthog/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

export class UnifiedBridgeService {
  #service: BridgeService | undefined

  // init and fetch configs
  async init({
    listenerApi
  }: {
    listenerApi: AppListenerEffectAPI
  }): Promise<boolean> {
    const state = listenerApi.getState()

    if (this.isInitialized()) {
      const prevState = listenerApi.getOriginalState()

      if (!this.shouldReinitializeBridge(prevState, state)) return false
    }

    const featureGates = this.getFeatureGateStates(state)
    const isTest = featureGates.isDeveloperMode
    const enabledBridgeTypes = this.getEnabledBridgeTypes(featureGates)

    const environment = isTest ? Environment.TEST : Environment.PROD
    const request = createInAppRequest(listenerApi.dispatch)

    Logger.info('initializing unified bridge service', {
      environment
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

    const initializers = this.getBridgeInitializers({
      enabledBridgeTypes,
      evmSigner,
      btcSigner,
      bitcoinFunctions: bitcoinProvider
    })

    const enabledBridgeServices = await getEnabledBridgeServices(
      environment,
      initializers
    )

    this.service = createUnifiedBridgeService({
      environment,
      enabledBridgeServices
    })

    return true
  }

  analyzeTx(params: AnalyzeTxParams): AnalyzeTxResult {
    return this.service.analyzeTx(params)
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

  private isInitialized(): boolean {
    return this.#service !== undefined
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

  private getBridgeInitializers({
    enabledBridgeTypes,
    evmSigner,
    btcSigner,
    bitcoinFunctions
  }: {
    enabledBridgeTypes: BridgeType[]
    evmSigner: EvmSigner
    btcSigner: BtcSigner
    bitcoinFunctions: BitcoinProvider
  }): BridgeInitializer[] {
    return enabledBridgeTypes.map(type => {
      switch (type) {
        case BridgeType.CCTP:
        case BridgeType.ICTT_ERC20_ERC20:
        case BridgeType.AVALANCHE_EVM:
          return {
            type,
            signer: evmSigner
          }

        case BridgeType.AVALANCHE_AVA_BTC:
          return {
            type,
            signer: evmSigner,
            bitcoinFunctions
          }

        case BridgeType.AVALANCHE_BTC_AVA:
          return {
            type,
            signer: btcSigner,
            bitcoinFunctions
          }
      }
    })
  }

  // Check if any of the feature gate states or developer mode has changed
  private shouldReinitializeBridge = (
    prevState: RootState,
    currState: RootState
  ): boolean => {
    const prevGates = this.getFeatureGateStates(prevState)
    const currGates = this.getFeatureGateStates(currState)

    return (
      prevGates.isCctpBlocked !== currGates.isCctpBlocked ||
      prevGates.isIcttBlocked !== currGates.isIcttBlocked ||
      prevGates.isAbEvmBlocked !== currGates.isAbEvmBlocked ||
      prevGates.isAbAvaToBtc !== currGates.isAbAvaToBtc ||
      prevGates.isAbBtcToAva !== currGates.isAbBtcToAva ||
      prevGates.isDeveloperMode !== currGates.isDeveloperMode
    )
  }

  // Helper function to get the blocked status of feature gates
  private getFeatureGateStates = (
    state: RootState
  ): {
    isCctpBlocked: boolean
    isIcttBlocked: boolean
    isAbEvmBlocked: boolean
    isAbAvaToBtc: boolean
    isAbBtcToAva: boolean
    isDeveloperMode: boolean
  } => ({
    isCctpBlocked: selectIsFeatureBlocked(
      state,
      FeatureGates.UNIFIED_BRIDGE_CCTP
    ),
    isIcttBlocked: selectIsFeatureBlocked(
      state,
      FeatureGates.UNIFIED_BRIDGE_ICTT
    ),
    isAbEvmBlocked: selectIsFeatureBlocked(
      state,
      FeatureGates.UNIFIED_BRIDGE_AB_EVM
    ),
    isAbAvaToBtc: selectIsFeatureBlocked(
      state,
      FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC
    ),
    isAbBtcToAva: selectIsFeatureBlocked(
      state,
      FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA
    ),
    isDeveloperMode: selectIsDeveloperMode(state)
  })

  // Get enabled bridge types based on feature gates
  private getEnabledBridgeTypes = (featureGates: {
    isCctpBlocked: boolean
    isIcttBlocked: boolean
    isAbEvmBlocked: boolean
    isAbAvaToBtc: boolean
    isAbBtcToAva: boolean
    isDeveloperMode: boolean
  }): BridgeType[] => {
    const enabledBridgeTypes: BridgeType[] = []

    if (!featureGates.isCctpBlocked) {
      enabledBridgeTypes.push(BridgeType.CCTP)
    }
    if (!featureGates.isIcttBlocked) {
      enabledBridgeTypes.push(BridgeType.ICTT_ERC20_ERC20)
    }
    if (!featureGates.isAbEvmBlocked) {
      enabledBridgeTypes.push(BridgeType.AVALANCHE_EVM)
    }
    if (!featureGates.isAbAvaToBtc) {
      enabledBridgeTypes.push(BridgeType.AVALANCHE_AVA_BTC)
    }
    if (!featureGates.isAbBtcToAva) {
      enabledBridgeTypes.push(BridgeType.AVALANCHE_BTC_AVA)
    }

    return enabledBridgeTypes
  }
}

export default new UnifiedBridgeService()
