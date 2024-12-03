import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  ChainAssetMap,
  getEnabledBridgeServices,
  EvmSigner,
  BtcSigner,
  BridgeAsset,
  Chain,
  TokenType,
  AnalyzeTxResult,
  AnalyzeTxParams,
  BridgeInitializer,
  GasSettings,
  Asset
} from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { BitcoinProvider } from '@avalabs/core-wallets-sdk'
import { lowerCaseKeys } from 'utils/lowerCaseKeys'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

export class UnifiedBridgeService {
  #service: BridgeService | undefined

  // init and fetch configs
  async init({
    enabledBridgeTypes,
    evmSigner,
    btcSigner,
    bitcoinProvider,
    environment
  }: {
    enabledBridgeTypes: BridgeType[]
    evmSigner: EvmSigner
    btcSigner: BtcSigner
    bitcoinProvider: BitcoinProvider
    environment: Environment
  }): Promise<void> {
    Logger.info('initializing unified bridge service', {
      environment
    })

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
  }): Promise<bigint | undefined> {
    const feeMap = lowerCaseKeys(
      await this.service.getFees({
        asset,
        amount,
        targetChain: await this.buildChain(targetNetwork),
        sourceChain: await this.buildChain(sourceNetwork)
      })
    )

    const identifier =
      asset.type === TokenType.NATIVE ? asset.symbol : asset.address

    if (!identifier) {
      throw new Error('invalid asset')
    }

    return feeMap[identifier.toLowerCase()] ?? undefined
  }

  async estimateReceiveAmount({
    asset,
    amount,
    targetNetwork,
    sourceNetwork,
    fromAddress,
    gasSettings
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    sourceNetwork: Network
    fromAddress: string
    gasSettings?: GasSettings
  }): Promise<{ asset: Asset; amount: bigint }> {
    const sourceChain = await this.buildChain(sourceNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    return await this.service.estimateReceiveAmount({
      asset,
      fromAddress,
      amount,
      sourceChain,
      targetChain,
      gasSettings
    })
  }

  async transfer({
    asset,
    amount,
    targetNetwork,
    sourceNetwork,
    fromAddress,
    toAddress,
    gasSettings,
    updateListener
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    sourceNetwork: Network
    fromAddress: string
    toAddress: string
    gasSettings?: GasSettings
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
      gasSettings
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

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  private async buildChain(network: Network): Promise<Chain> {
    return {
      chainId: getCaip2ChainId(network.chainId),
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
}

export default new UnifiedBridgeService()
