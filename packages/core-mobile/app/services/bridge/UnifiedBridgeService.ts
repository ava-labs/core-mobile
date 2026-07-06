import {
  createUnifiedBridgeService,
  Environment,
  BridgeType,
  getEnabledBridgeServices,
  EvmSigner,
  BtcSigner,
  AnalyzeTxResult,
  AnalyzeTxParams,
  BridgeInitializer
} from '@avalabs/bridge-unified'
import Logger from 'utils/Logger'
import { BitcoinProvider } from '@avalabs/core-wallets-sdk'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

/**
 * Wraps `@avalabs/bridge-unified` for use by Core Mobile.
 *
 * After legacy Bridge removal (CP-14118), this service is only consumed
 * by `convertTransaction` to enrich activity history via `analyzeTx`.
 * Fusion runs its own bridge transfers through `FusionService` and does
 * not go through this service.
 */
export class UnifiedBridgeService {
  #service: BridgeService | undefined

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
    Logger.info('initializing unified bridge service', { environment })

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

    this.#service = createUnifiedBridgeService({
      environment,
      enabledBridgeServices
    })
  }

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  /**
   * Analyse a transaction to determine whether it is a known bridge transfer
   * and, if so, extract source/target chain ids for activity history display.
   *
   * Returns `undefined` when the SDK has not finished initialising yet —
   * `init()` is async and may not have completed by the time the first
   * activity batch is processed. Callers (`convertTransaction`) already
   * treat a missing `bridgeAnalysis` as "not a bridge tx".
   */
  analyzeTx(params: AnalyzeTxParams): AnalyzeTxResult | undefined {
    if (!this.#service) return undefined
    return this.#service.analyzeTx(params)
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
