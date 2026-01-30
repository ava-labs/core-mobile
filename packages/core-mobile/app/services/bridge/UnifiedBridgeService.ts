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
        targetChain: this.buildChain(targetNetwork),
        sourceChain: this.buildChain(sourceNetwork)
      })
    )

    // We currently operate on the assumption that the fee is paid in the
    // same token as is bridged.
    // Although sometimes it may be paid on the source chain (as is the case for CCTP),
    // and sometimes it may be paid on the target chain (i.e. Avalanche Bridge), the
    // result for the end users is that the received amount on the target chain is lowered
    // by the fee amount.
    const feeChainId = Object.keys(feeMap)[0] // ID of the chain where the fee is paid
    if (feeChainId === undefined) return undefined

    const feeChain = feeMap[feeChainId]
    if (feeChain === undefined) return undefined

    const feeAssetId = Object.keys(feeChain)[0] // address or "NATIVE"
    if (feeAssetId === undefined) return undefined

    return feeChain[feeAssetId as keyof typeof feeChain] ?? undefined
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
    const sourceChain = this.buildChain(sourceNetwork)
    const targetChain = this.buildChain(targetNetwork)

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
    const sourceChain = this.buildChain(sourceNetwork)
    const targetChain = this.buildChain(targetNetwork)

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

    const sourceChain = this.buildChain(sourceNetwork)
    const targetChain = this.buildChain(targetNetwork)

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
    const sourceChain = this.buildChain(sourceNetwork)
    const targetChain = this.buildChain(targetNetwork)

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

  private buildChain(network: Network): Chain {
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
    // @ts-expect-error
    // TODO: add other bridge initializers when project fusion is ready
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
