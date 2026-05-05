import { FeatureGates } from 'services/posthog/types'
import type { FeatureFlags } from 'services/posthog/types'
import type {
  BitcoinFunctions,
  BtcSigner,
  Environment,
  EstimateNativeFeeOptions,
  EvmSignerWithMessage,
  GasSettings,
  GetMinimumTransferAmountProps,
  NativeFeeEstimate,
  Quote,
  QuoterInterface,
  ServiceType,
  Transfer,
  TransferManager,
  Fetch,
  SolanaSigner
} from '@avalabs/fusion-sdk'

/**
 * The subset of PostHog feature flags consumed by FusionService.
 */
export type FusionServiceFlags = Pick<
  FeatureFlags,
  | FeatureGates.FUSION_MARKR
  | FeatureGates.FUSION_AVALANCHE_EVM
  | FeatureGates.FUSION_LOMBARD_BTC_TO_BTCB
  | FeatureGates.FUSION_LOMBARD_BTCB_TO_BTC
  | FeatureGates.FUSION_DISABLE_CROSS_CHAIN_SWAPS
>

/**
 * Configuration for initializing the Fusion SDK
 */
export interface FusionConfig {
  environment: Environment
  enabledServices: ServiceType[]
  fetch: Fetch
  disableCrossChainSwaps?: boolean
}

/**
 * Signers required for Fusion operations
 */
export interface FusionSigners {
  evm: EvmSignerWithMessage
  btc: BtcSigner
  svm: SolanaSigner
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
   * @param gasSettings Gas settings passed through to the Fusion SDK
   * @returns Transfer object with status and transaction details
   */
  transferAsset(quote: Quote, gasSettings: GasSettings): Promise<Transfer>

  /**
   * Track a transfer's status changes via the SDK
   * @param transfer The transfer to track
   * @param updateListener Callback invoked on every status change
   */
  trackTransfer(
    transfer: Transfer,
    updateListener: (updated: Transfer) => void
  ): void

  /**
   * Estimate the native fee required to execute the provided quote.
   */
  estimateNativeFee(
    quote: Quote,
    options?: EstimateNativeFeeOptions
  ): Promise<NativeFeeEstimate>

  /**
   * Returns the minimum source amount per service for the given token pair.
   */
  getMinimumTransferAmount(
    props: GetMinimumTransferAmountProps
  ): Promise<{ [key in ServiceType]?: bigint } | null>

  /**
   * Calculate price impact for the given quote.
   * Returns basis points (bps) or null if unavailable.
   * @param quote The quote to evaluate
   * @param sourcePrice USD price per unit of the source token
   * @param targetPrice USD price per unit of the target token
   */
  calculatePriceImpactFromQuote(
    quote: Quote,
    sourcePrice: number,
    targetPrice: number
  ): Promise<number | null>

  /**
   * Cleanup and reset the service
   */
  cleanup(): void
}
