import { type AssetPosition, type ClearinghouseState } from '@avalabs/perps-sdk'
import { useMemo } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { useHip3Positions } from './useHip3Positions'
import { usePerpsClearinghouse } from './usePerpsClearinghouse'

export type PerpsPositions = {
  /** Main-dex (non-zero) + HIP-3 open positions, merged for display. */
  readonly positions: readonly AssetPosition[]
  /** The main-dex clearinghouse state (for account-abstraction–aware figures). */
  readonly clearinghouse: ClearinghouseState | undefined
  /** Total account value: main-dex equity + summed HIP-3 isolated value. */
  readonly accountValueUsd: number | undefined
  /** Withdrawable now, in USD. Main-dex only (HIP-3 ledgers are isolated). */
  readonly withdrawableUsd: number | undefined
  readonly isLoading: boolean
}

/**
 * The active account's complete open-position view: the main-dex clearinghouse
 * positions merged with every HIP-3 (builder-dex) isolated clearinghouse.
 *
 * Both sources are seeded over REST and kept live over the `clearinghouseState`
 * WebSocket channel (see {@link usePerpsClearinghouse} and
 * {@link useHip3Positions}), so positions — including price-driven liquidations
 * — update without waiting for a manual refresh.
 *
 * `accountValueUsd` folds the HIP-3 isolated account values into the main-dex
 * total; `withdrawableUsd` stays main-dex only (builder ledgers are isolated and
 * not withdrawable through the main account), so withdraw / seed callers should
 * keep reading {@link usePerpsClearinghouse} directly.
 */
export const usePerpsPositions = (): PerpsPositions => {
  const { userAddress } = usePerps()
  const {
    clearinghouse,
    positions: mainPositions,
    accountValueUsd: mainAccountValueUsd,
    withdrawableUsd,
    isLoading: mainLoading
  } = usePerpsClearinghouse()
  const hip3 = useHip3Positions(userAddress)

  const positions = useMemo(
    () => [
      ...mainPositions.filter(
        assetPosition => Number.parseFloat(assetPosition.position.szi) !== 0
      ),
      ...hip3.positions
    ],
    [mainPositions, hip3.positions]
  )

  const accountValueUsd =
    mainAccountValueUsd === undefined
      ? undefined
      : mainAccountValueUsd + hip3.accountValueUsd

  return {
    positions,
    clearinghouse,
    accountValueUsd,
    withdrawableUsd,
    isLoading: mainLoading || hip3.isLoading
  }
}
