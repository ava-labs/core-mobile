import type {
  BitcoinFunctions,
  BtcSigner,
  Environment,
  EvmSignerWithMessage,
  Quote,
  QuoterInterface,
  ServiceType,
  Transfer,
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
   * Get supported chains map from the Fusion Service
   * Returns the full Map structure with source → destinations mapping
   * @returns Promise resolving to Map<sourceChainId, Set<destinationChainIds>> (CAIP-2 format)
   */
  getSupportedChains(): Promise<ReadonlyMap<string, ReadonlySet<string>>>

  /**
   * Creates a Quoter instance for fetching real-time swap quotes
   * @param params Quote request parameters
   * @returns Quoter instance
   */
  getQuoter(params: QuoterParams): QuoterInterface | null

  /**
   * Execute a transfer using the provided quote
   * @param quote The quote to execute
   * @returns Transfer object with status and transaction details
   */
  transferAsset(quote: Quote): Promise<Transfer>

  /**
   * Estimate gas for a quote
   * @param quote The quote to estimate gas for
   * @returns Estimated gas in BigInt
   */
  estimateGas(quote: Quote): Promise<bigint>

  /**
   * Cleanup and reset the service
   */
  cleanup(): void
}
