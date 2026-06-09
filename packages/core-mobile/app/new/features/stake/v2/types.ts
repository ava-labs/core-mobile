import { StakeTargetValidator } from 'types/earn'

/**
 * How a stake-confirm flow charges (or doesn't charge) a convenience fee
 * on top of the gross delegation reward. Lives on `StakeReviewSource` so
 * each flow can declare its own policy; the screen does the actual
 * `gross × rate` math and builds the escrow output.
 */
export interface StakeFeePolicy {
  /**
   * Multiplier applied to `grossEstimatedReward.estimatedTokenReward`.
   * Expressed as a fraction in the [0, 1) range (e.g. 0.1 = 10%).
   */
  rate: number
  /**
   * P-Chain bech32 co-owners of the convenience-fee escrow output. At
   * least one address is required; multiple entries become co-owners on
   * the same UTXO.
   */
  recipientAddresses: readonly string[]
}

/**
 * The interface the V2 `StakeConfirmScreen` depends on. Each flow (Fast
 * Stake, advanced delegate, future variants) provides its own hook that
 * returns this shape; the screen consumes it and stays flow-agnostic.
 *
 * This is the seam that prevents Fast Stake-specific concerns (server-
 * side validator selection, the convenience fee) from silently leaking
 * into other flows when they reuse the same confirm screen.
 *
 * Pure route metadata that doesn't affect the screen's behaviour (e.g.
 * the `isAdvanced` analytics label) lives on the screen's own props,
 * not here.
 */
export interface StakeReviewSource {
  /** Resolved target validator (`nodeID` + `endTime`), or undefined while loading / on miss. */
  validator: StakeTargetValidator | undefined
  /** True while the underlying validator lookup is in flight. */
  isFetching: boolean
  /** Surface for the "No match found" alert; null when the lookup is healthy. */
  error: Error | null
  /** Null when this flow doesn't charge a fee at all (e.g. the advanced delegate path). */
  feePolicy: StakeFeePolicy | null
}
