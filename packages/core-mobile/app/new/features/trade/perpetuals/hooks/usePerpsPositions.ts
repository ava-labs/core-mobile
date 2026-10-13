import {
  spotCountsAsPerpCollateral,
  type AssetPosition,
  type ClearinghouseState,
  type UserAbstractionMode
} from '@avalabs/perps-sdk'
import { useMemo } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { useHip3Positions } from './useHip3Positions'
import { usePerpsClearinghouse } from './usePerpsClearinghouse'

export type PerpsPositions = {
  /** Main-dex (non-zero) + HIP-3 open positions, merged for display. */
  readonly positions: readonly AssetPosition[]
  /** The main-dex clearinghouse state (for account-abstraction–aware figures). */
  readonly clearinghouse: ClearinghouseState | undefined
  /** Account-mode-aware total equity across the relevant balance source(s). */
  readonly accountValueUsd: number | undefined
  /** Account-mode-aware USDC withdraw cap. */
  readonly withdrawableUsd: number | undefined
  readonly mode: UserAbstractionMode | undefined
  readonly isWithdrawableLoading: boolean
  readonly isWithdrawableUnavailable: boolean
  readonly isLoading: boolean
  /**
   * `true` when the main-dex clearinghouse fetch failed with no data — balance
   * figures here are then not "zero" but "unknown". Gate balance-driven UI on
   * this and offer {@link refetch}.
   */
  readonly isError: boolean
  readonly refetch: () => void
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
 * In standard modes, `accountValueUsd` folds HIP-3 isolated account values into
 * the main-dex total. Unified / portfolio-margin accounts use the spot USDC
 * component reported by the SDK, so isolated per-DEX account values are not
 * added. A whole-portfolio value would also need separately priced non-USDC
 * collateral. `withdrawableUsd` remains the account-mode-aware SDK figure.
 */
export const usePerpsPositions = (): PerpsPositions => {
  const { userAddress } = usePerps()
  const {
    clearinghouse,
    positions: mainPositions,
    mode,
    accountValueUsd: mainAccountValueUsd,
    withdrawableUsd,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    isLoading: mainLoading,
    isError,
    refetch
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
      : mainAccountValueUsd +
        (spotCountsAsPerpCollateral(mode) ? 0 : hip3.accountValueUsd)

  return {
    positions,
    clearinghouse,
    accountValueUsd,
    withdrawableUsd,
    mode,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    isLoading: mainLoading || hip3.isLoading,
    isError,
    refetch
  }
}
