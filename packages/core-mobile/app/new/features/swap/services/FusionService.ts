import type {
  CompletedTransfer,
  FailedTransfer,
  GasSettings,
  GetBridgeableAssetsProps,
  GetBridgeableAssetsResult,
  RefundedTransfer
} from '@avalabs/fusion-sdk'
import {
  BitcoinFunctions,
  calculatePriceImpactFromQuote as _calculatePriceImpactFromQuote,
  createTransferManager,
  Environment,
  EstimateNativeFeeOptions,
  EvmServiceInitializer,
  GetMinimumTransferAmountProps,
  LombardServiceInitializer,
  MarkrServiceInitializer,
  NativeFeeEstimate,
  Quote,
  QuoterInterface,
  ServiceInitializer,
  ServiceType,
  Transfer,
  TransferManager,
  Fetch
} from '@avalabs/fusion-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import { FeatureGates } from 'services/posthog/types'
import Logger from 'utils/Logger'
import { fusionErrors } from '../utils/fusionErrors'
import { MARKR_EVM_PARTNER_ID } from '../consts'
import { isConcludedTransfer } from '../utils/transferStatus'
import { fetchMarkrTargetChainAssets } from './fetchMarkrTargetChainAssets'
import type {
  FusionConfig,
  FusionServiceFlags,
  FusionSigners,
  IFusionService,
  QuoterParams
} from './types'

/**
 * Service class for managing Fusion SDK TransferManager
 *
 * This service initializes and manages the TransferManager instance
 * based on enabled feature flags and provides signers for transaction signing.
 */
class FusionService implements IFusionService {
  #transferManager: TransferManager | null = null
  #trackingCancels = new Map<string, () => void>()

  /**
   * Private getter that throws if the service is not initialized
   */
  private get transferManager(): TransferManager {
    if (!this.#transferManager) {
      throw fusionErrors.serviceNotInitialized()
    }
    return this.#transferManager
  }

  /**
   * Get enabled services based on feature flags
   */
  private getEnabledServices(featureFlags: FusionServiceFlags): ServiceType[] {
    const services: ServiceType[] = []

    if (featureFlags['fusion-markr']) {
      services.push(ServiceType.MARKR)
    }

    if (featureFlags['fusion-avalanche-evm']) {
      services.push(ServiceType.AVALANCHE_EVM)
    }

    if (featureFlags['fusion-lombard-btc-to-btcb']) {
      services.push(ServiceType.LOMBARD_BTC_TO_BTCB)
    }

    if (featureFlags['fusion-lombard-btcb-to-btc']) {
      services.push(ServiceType.LOMBARD_BTCB_TO_BTC)
    }

    return services
  }

  /**
   * Create service initializers based on enabled services
   */
  private getServiceInitializers({
    btcFunctions,
    enabledServices,
    signers,
    disableCrossChainSwaps
  }: {
    btcFunctions: BitcoinFunctions
    enabledServices: ServiceType[]
    signers: FusionSigners
    disableCrossChainSwaps: boolean
  }): ServiceInitializer[] {
    const initializers: ServiceInitializer[] = []
    for (const serviceType of enabledServices) {
      switch (serviceType) {
        case ServiceType.MARKR:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm,
            solanaSigner: signers.svm,
            markrAppId: MARKR_EVM_PARTNER_ID,
            getTargetChainAssets: fetchMarkrTargetChainAssets,
            disableCrossChainSwaps
            // eslint-disable-next-line prettier/prettier
          } satisfies MarkrServiceInitializer)
          break

        case ServiceType.AVALANCHE_EVM:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm
          } satisfies EvmServiceInitializer)
          break

        case ServiceType.LOMBARD_BTC_TO_BTCB:
        case ServiceType.LOMBARD_BTCB_TO_BTC:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm,
            btcSigner: signers.btc,
            btcFunctions
          } satisfies LombardServiceInitializer)
          break
        default:
          throw fusionErrors.unknownServiceType(serviceType)
      }
    }

    // Always include wrap/unwrap service
    initializers.push({
      type: ServiceType.WRAP_UNWRAP,
      evmSigner: signers.evm
    } satisfies EvmServiceInitializer)

    return initializers
  }

  /**
   * Initialize the Fusion service
   */
  async init({
    bitcoinProvider,
    config,
    signers
  }: {
    bitcoinProvider: BitcoinFunctions
    config: FusionConfig
    signers: FusionSigners
  }): Promise<void> {
    try {
      const initializers = this.getServiceInitializers({
        btcFunctions: bitcoinProvider,
        enabledServices: config.enabledServices,
        signers,
        disableCrossChainSwaps: config.disableCrossChainSwaps ?? false
      })

      // Ensure at least one service is enabled
      if (initializers.length === 0) {
        Logger.warn('No Fusion services enabled. Skipping initialization.')
        return
      }

      // Create the TransferManager instance
      this.#transferManager = await createTransferManager({
        environment: config.environment,
        fetch: config.fetch,
        serviceInitializers: initializers as [
          ServiceInitializer,
          ...ServiceInitializer[]
        ]
      })

      Logger.info('Fusion service initialized successfully', {
        environment: config.environment,
        enabledServices: config.enabledServices
      })
    } catch (error) {
      Logger.error(
        `Failed to initialize Fusion service: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        {
          error,
          environment: config.environment,
          enabledServices: config.enabledServices
        }
      )

      throw error
    }
  }

  /**
   * Initialize with feature flags
   * Helper method that determines enabled services from feature flags
   */
  async initWithFeatureFlags({
    bitcoinProvider,
    fetch,
    environment,
    featureFlags,
    signers
  }: {
    bitcoinProvider: BitcoinFunctions
    fetch: Fetch
    environment: Environment
    featureFlags: FusionServiceFlags
    signers: FusionSigners
  }): Promise<void> {
    const enabledServices = this.getEnabledServices(featureFlags)
    const disableCrossChainSwaps =
      !!featureFlags[FeatureGates.FUSION_DISABLE_CROSS_CHAIN_SWAPS]

    return this.init({
      bitcoinProvider,
      config: { environment, enabledServices, fetch, disableCrossChainSwaps },
      signers
    })
  }

  /**
   * Get supported chains map from the TransferManager
   * Returns the full Map structure with source → destinations mapping
   *
   * @returns Promise resolving to Map<sourceChainId, Set<destinationChainIds>> (CAIP-2 format)
   */
  async getSupportedChains(): Promise<
    ReadonlyMap<string, ReadonlySet<string>>
  > {
    try {
      const chainsMap = await this.transferManager.getSupportedChains()

      // Log supported chains with their destinations
      Logger.info(
        `Fusion Service: ${chainsMap.size} source chains with destinations`
      )
      chainsMap.forEach((destinations, source) => {
        Logger.info(
          `Chain ${source} can transfer to ${destinations.size} destinations:`,
          Array.from(destinations)
        )
      })

      return chainsMap
    } catch (error) {
      Logger.error('Failed to fetch supported chains map', error)
      throw error
    }
  }

  /**
   * Returns assets the user can swap to on the target chain for a given source asset and chain.
   * The MARKR service internally calls `getTargetChainAssets` and filters by supported routes.
   */
  async getBridgeableAssets(
    props: GetBridgeableAssetsProps
  ): Promise<GetBridgeableAssetsResult> {
    try {
      return await this.transferManager.getBridgeableAssets(props)
    } catch (error) {
      Logger.error('[FusionService] getBridgeableAssets failed', error)
      throw error
    }
  }

  /**
   * Creates a Quoter instance for fetching real-time swap quotes
   * @param params Quote request parameters
   * @returns Quoter instance
   */
  getQuoter(params: QuoterParams): QuoterInterface | null {
    try {
      const quoter = this.transferManager.getQuoter(params)
      Logger.info('Quoter instance created successfully')
      return quoter
    } catch (error) {
      Logger.error('Failed to create Quoter instance', error)
      throw error
    }
  }

  /**
   * Execute a transfer using the provided quote
   * @param quote The quote to execute
   * @param gasSettings Gas settings passed through to the Fusion SDK
   * @returns Transfer object with status and transaction details
   */
  async transferAsset(
    quote: Quote,
    gasSettings: GasSettings
  ): Promise<Transfer> {
    try {
      Logger.info('Executing transfer with quote:', {
        aggregator: quote.aggregator.name,
        serviceType: quote.serviceType
      })

      const transfer = await this.transferManager.transferAsset({
        quote,
        gasSettings
      })

      Logger.info('Transfer executed:', {
        transferId: transfer.id,
        status: transfer.status
      })

      return transfer
    } catch (error) {
      Logger.error('Failed to execute transfer', error)
      throw error
    }
  }

  /**
   * Track a transfer's status changes via the SDK
   * Calls updateListener on each status update and when the transfer completes
   * @param transfer The transfer to track
   * @param updateListener Callback invoked on every status change
   * @param onCompleted Optional callback invoked once when tracking concludes
   */
  trackTransfer(
    transfer: Transfer,
    updateListener: (updated: Transfer) => void,
    onCompleted?: (
      concluded: CompletedTransfer | FailedTransfer | RefundedTransfer
    ) => void
  ): void {
    const wrappedListener = (updated: Transfer): void => {
      Logger.info('[FusionService] new transfer status', {
        transferId: updated.id,
        status: updated.status
      })
      updateListener(updated)
    }

    const { cancel, result } = this.transferManager.trackTransfer({
      transfer,
      updateListener: wrappedListener
    })

    this.#trackingCancels.set(transfer.id, cancel)

    result
      .then(concluded => {
        this.#trackingCancels.delete(concluded.id)
        if (isConcludedTransfer(concluded)) {
          onCompleted?.(concluded)
        }
      })
      .catch(err => {
        Logger.error('[FusionService] trackTransfer error', err)
        this.#trackingCancels.delete(transfer.id)
      })
  }

  /**
   * Estimate the native fee required to execute the provided quote.
   */
  async estimateNativeFee(
    quote: Quote,
    options?: EstimateNativeFeeOptions
  ): Promise<NativeFeeEstimate> {
    return this.transferManager.estimateNativeFee(quote, options)
  }

  /**
   * Returns the minimum source amount per service for the given token pair.
   * Returns null when no service supports the pair.
   */
  async getMinimumTransferAmount(
    props: GetMinimumTransferAmountProps
  ): Promise<{ [key in ServiceType]?: bigint } | null> {
    return this.transferManager.getMinimumTransferAmount(props)
  }

  /**
   * Calculate price impact for the given quote.
   * Returns basis points (bps) or null if the SDK cannot determine the impact.
   * @param quote The quote to evaluate
   * @param sourcePrice USD price per unit of the source token
   * @param targetPrice USD price per unit of the target token
   */
  async calculatePriceImpactFromQuote(
    quote: Quote,
    sourcePrice: number,
    targetPrice: number
  ): Promise<number | null> {
    return _calculatePriceImpactFromQuote(quote, async (input, output) => {
      const inputAmount = bigintToBig(
        input.amount,
        input.asset.decimals
      ).toNumber()
      const outputAmount = bigintToBig(
        output.amount,
        output.asset.decimals
      ).toNumber()

      return [inputAmount * sourcePrice, outputAmount * targetPrice]
    })
  }

  /**
   * Cleanup and reset the service.
   * Cancels all in-flight tracking before destroying the transferManager.
   */
  cleanup(): void {
    for (const cancel of this.#trackingCancels.values()) {
      cancel()
    }
    this.#trackingCancels.clear()
    this.#transferManager = null
    Logger.info('Fusion service cleaned up')
  }
}

// Export a singleton instance
export default new FusionService()
