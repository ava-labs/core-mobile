import type {
  BitcoinFunctions,
  BtcSigner,
  Environment,
  EvmSignerWithMessage,
  QuoterInterface,
  ServiceType,
  TransferManager,
  FetchFunction
} from '@avalabs/unified-asset-transfer'

/**
 * Configuration for initializing the Fusion SDK
 */
export interface FusionConfig {
  environment: Environment
  enabledServices: ServiceType[]
  fetch: FetchFunction
}

/**
 * Signers required for Fusion operations
 */
export interface FusionSigners {
  evm: EvmSignerWithMessage
  btc: BtcSigner
}

/**
 * Parameters for creating a Quoter instance
 * Extracts the parameter type from TransferManager's getQuoter method
 */
export type QuoterParams = Parameters<TransferManager['getQuoter']>[0]

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
   * Get supported chains from the Fusion Service
   * Returns CAIP-2 chain IDs that are supported by the enabled services
   */
  getSupportedChains(): Promise<readonly string[]>

  /**
   * Creates a Quoter instance for fetching real-time swap quotes
   * @param params Quote request parameters
   * @returns Quoter instance
   */
  getQuoter(params: QuoterParams): QuoterInterface | null

  /**
   * Cleanup and reset the service
   */
  cleanup(): void
}
