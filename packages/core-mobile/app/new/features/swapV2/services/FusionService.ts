import {
  BitcoinFunctions,
  createTransferManager,
  Environment,
  EvmServiceInitializer,
  FetchFunction,
  LombardServiceInitializer,
  MarkrServiceInitializer,
  Quote,
  QuoterInterface,
  ServiceInitializer,
  ServiceType,
  Transfer,
  TransferManager
} from '@avalabs/unified-asset-transfer'
import type { FeatureFlags } from 'services/posthog/types'
import Logger from 'utils/Logger'
import {
  MARKR_API_URL,
  MARKR_EVM_PARTNER_ID
} from '../consts'
import type {
  FusionConfig,
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

  /**
   * Private getter that throws if the service is not initialized
   */
  private get transferManager(): TransferManager {
    if (!this.#transferManager) {
      throw new Error('Fusion service is not initialized')
    }
    return this.#transferManager
  }

  /**
   * Get enabled services based on feature flags
   */
  private getEnabledServices(featureFlags: FeatureFlags): ServiceType[] {
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
    signers
  }: {
    btcFunctions: BitcoinFunctions
    enabledServices: ServiceType[]
    signers: FusionSigners
  }): ServiceInitializer[] {
    const initializers: ServiceInitializer[] = []

    for (const serviceType of enabledServices) {
      switch (serviceType) {
        case ServiceType.MARKR:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm,
            markrApiUrl: MARKR_API_URL,
            markrAppId: MARKR_EVM_PARTNER_ID,
            // eslint-disable-next-line prettier/prettier
          } satisfies MarkrServiceInitializer)
          break

        case ServiceType.AVALANCHE_EVM:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm,
          } satisfies EvmServiceInitializer)
          break

        case ServiceType.LOMBARD_BTC_TO_BTCB:
        case ServiceType.LOMBARD_BTCB_TO_BTC:
          initializers.push({
            type: serviceType,
            evmSigner: signers.evm,
            btcSigner: signers.btc,
            btcFunctions,
             
          } satisfies LombardServiceInitializer)
          break

        default:
          throw new Error(`Unknown service type: ${serviceType}`)
      }
    }

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
      Logger.info('Initializing Fusion service', {
        environment: config.environment,
        enabledServices: config.enabledServices
      })

      const initializers = this.getServiceInitializers({
        btcFunctions: bitcoinProvider,
        enabledServices: config.enabledServices,
        signers
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

      Logger.info('Fusion service initialized successfully')
    } catch (error) {
      Logger.error('Failed to initialize Fusion service', error)
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
    fetch: FetchFunction
    environment: Environment
    featureFlags: FeatureFlags
    signers: FusionSigners
  }): Promise<void> {
    const enabledServices = this.getEnabledServices(featureFlags)

    return this.init({
      bitcoinProvider,
      config: { environment, enabledServices, fetch },
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
   * @returns Transfer object with status and transaction details
   */
  async transferAsset(quote: Quote): Promise<Transfer> {
    try {
      Logger.info('Executing transfer with quote:', {
        aggregator: quote.aggregator.name,
        serviceType: quote.serviceType
      })

      const transfer = await this.transferManager.transferAsset({ quote })

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
   * Estimate gas for a quote
   * @param quote The quote to estimate gas for
   * @returns Estimated gas in BigInt
   */
  async estimateGas(quote: Quote): Promise<bigint> {
    try {
      const gasEstimate = await this.transferManager.estimateGas({ quote })
      Logger.info('Gas estimated:', gasEstimate.toString())
      return gasEstimate
    } catch (error) {
      Logger.error('Failed to estimate gas', error)
      throw error
    }
  }

  /**
   * Cleanup and reset the service
   */
  cleanup(): void {
    this.#transferManager = null
    Logger.info('Fusion service cleaned up')
  }
}

// Export a singleton instance
export default new FusionService()
