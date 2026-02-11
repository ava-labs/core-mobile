import type {
  BitcoinFunctions,
  BtcSigner,
  Environment,
  EvmSignerWithMessage,
  ServiceType,
  TransferManager
} from '@avalabs/unified-asset-transfer'

/**
 * Configuration for initializing the Fusion SDK
 */
export interface FusionConfig {
  environment: Environment
  enabledServices: ServiceType[]
}

/**
 * Signers required for Fusion operations
 */
export interface FusionSigners {
  evm: EvmSignerWithMessage
  btc: BtcSigner
}

/**
 * Service interface for Fusion SDK operations
 */
export interface IFusionService {
  /**
   * Initialize the Fusion service with signers and configuration
   */
  init({
    bitcoinProvider,
    config,
    signers
  }: {
    bitcoinProvider: BitcoinFunctions
    config: FusionConfig
    signers: FusionSigners
  }): Promise<void>

  /**
   * Get the initialized TransferManager instance
   */
  getTransferManager(): TransferManager | null

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean

  /**
   * Cleanup and reset the service
   */
  cleanup(): void
}
