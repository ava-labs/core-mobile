import {
  BitcoinFunctions,
  createTransferManager,
  Environment,
  EvmServiceInitializer,
  LombardServiceInitializer,
  MarkrServiceInitializer,
  QuoterInterface,
  ServiceInitializer,
  ServiceType,
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
    environment,
    featureFlags,
    signers
  }: {
    bitcoinProvider: BitcoinFunctions
    environment: Environment
    featureFlags: FeatureFlags
    signers: FusionSigners
  }): Promise<void> {
    const enabledServices = this.getEnabledServices(featureFlags)

    return this.init({
      bitcoinProvider,
      config: { environment, enabledServices },
      signers
    })
  }

  /**
   * Get supported chains from the TransferManager
   * Returns CAIP-2 chain IDs that are supported by the enabled services
   *
   * @returns Promise resolving to array of CAIP-2 chain IDs
   */
  async getSupportedChains(): Promise<readonly string[]> {
    try {
      const chains = await this.transferManager.getSupportedChains()
      Logger.info(`Fusion Service supports ${chains.length} chains`, chains)
      return chains
    } catch (error) {
      Logger.error('Failed to fetch supported chains from Fusion Service', error)
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
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.#transferManager !== null
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
