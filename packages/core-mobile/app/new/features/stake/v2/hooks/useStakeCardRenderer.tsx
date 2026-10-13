import { PChainTransaction } from '@avalabs/glacier-sdk'
import { Motion } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { truncateNodeId } from 'utils/Utils'
import { getActiveStakeProgress, getStakedAmount } from '../../utils'
import { StakeCard } from '../components/StakeCard'
import { isDelegationTx } from '../utils/isDelegationTx'
import { isFastStakeTx } from '../utils/isFastStakeTx'
import { ensureCurrencySuffix, formatEndDate } from '../utils/cardFormat'
import { getStakeTitle } from '../utils'
import { useRestake } from './useRestake'

export interface UseStakeCardRendererArgs {
  /** Time snapshot used for status detection and progress calculation. */
  now: Date
  /** Optional accelerometer-driven motion for the wave animation. */
  motion?: Motion
  /** Pixel width of each card cell. */
  width: number
  /** Callback fired when a card is tapped. */
  onPressStake: (txHash: string) => void
}

/**
 * Returns a memoised `(stake) => JSX.Element | null` that renders a single V2
 * `StakeCard`. Returns `null` for stakes that are neither currently active nor
 * completed (e.g. pending), so callers should still guard / pre-filter when
 * the surrounding list (FlashList masonry) needs the cell count to match the
 * rendered count.
 *
 * Shared by the V2 stake home screen (`StakeCardList`) and the stake search
 * screen (`StakeSearchScreen`) — both surfaces render the same card cell with
 * the same currency / motion / status plumbing.
 */
export const useStakeCardRenderer = ({
  now,
  motion,
  width,
  onPressStake
}: UseStakeCardRendererArgs): ((
  stake: PChainTransaction
) => JSX.Element | null) => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const pChainNetwork = useMemo(
    () => NetworkService.getAvalancheNetworkP(isDevMode),
    [isDevMode]
  )
  const { networkToken: pChainNetworkToken } = pChainNetwork
  const avaxPrice = useAvaxPrice()
  const { formatTokenInCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { getOnRestake } = useRestake()

  return useCallback(
    (stake: PChainTransaction): JSX.Element | null => {
      const stakeIsCompleted = isCompleted(stake, now)
      const stakeIsActive = isOnGoing(stake, now)
      if (!stakeIsCompleted && !stakeIsActive) return null

      const stakedTokenUnit = getStakedAmount(stake, pChainNetworkToken)
      const stakedAmount = stakedTokenUnit
        ? `${stakedTokenUnit.toDisplay({ fixedDp: 2 })} AVAX`
        : `${UNKNOWN_AMOUNT} AVAX`
      const stakedUsdValue = stakedTokenUnit
        ? ensureCurrencySuffix(
            formatTokenInCurrency({
              amount: stakedTokenUnit
                .mul(avaxPrice)
                .toDisplay({ asNumber: true })
            }),
            selectedCurrency
          )
        : UNKNOWN_AMOUNT

      // On-chain detection: show the Fast Stake badge whenever the
      // delegation tx carried a UTXO output to the convenience-fee escrow
      // address (see `isFastStakeTx`) — applied to both active and
      // completed cards to match the web table behaviour. Fee-less
      // delegations (e.g. from the advanced flow) fall back to the
      // txType-based `delegating` badge, mirroring web's type label. The
      // `validating` badge remains follow-up work.
      const isFastStake = isFastStakeTx(stake, isDevMode)

      return (
        <StakeCard
          variant={stakeIsActive ? 'active' : 'completed'}
          title={getStakeTitle({
            stake,
            pChainNetworkToken,
            isActive: stakeIsActive
          })}
          stakedAmount={stakedAmount}
          stakedUsdValue={stakedUsdValue}
          nodeId={truncateNodeId(stake.nodeId ?? '')}
          endDate={formatEndDate(stake.endTimestamp)}
          progress={
            stakeIsActive ? getActiveStakeProgress(stake, now) : undefined
          }
          motion={motion}
          badge={
            isFastStake
              ? 'fastStake'
              : isDelegationTx(stake)
              ? 'delegating'
              : undefined
          }
          width={width}
          onPress={() => onPressStake(stake.txHash)}
          // Undefined for active stakes and for txs that can't seed a
          // restake, hiding the card's Restake button (web parity: only
          // completed stakes offer Restake).
          onRestake={getOnRestake(stake, stakeIsCompleted, 'card')}
        />
      )
    },
    [
      now,
      isDevMode,
      pChainNetworkToken,
      avaxPrice,
      formatTokenInCurrency,
      selectedCurrency,
      motion,
      width,
      onPressStake,
      getOnRestake
    ]
  )
}
