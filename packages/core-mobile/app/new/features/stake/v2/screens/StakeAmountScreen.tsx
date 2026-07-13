import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  CircularDial,
  normalizeErrorMessage,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useDelegationContext } from 'contexts/DelegationContext'
import { Href, useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { useStakeEstimatedReward } from 'features/stake/hooks/useStakeEstimatedReward'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import useStakingParams from 'hooks/earn/useStakingParams'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getMaximumStakeEndDate } from 'services/earn/utils'
import {
  selectFastStakeFeeRate,
  selectIsFastStakeFeeBlocked
} from 'store/posthog'
import { Seconds } from 'types/siUnits'
import { stringToBigint } from 'utils/bigNumbers/stringToBigint'
import { xpChainToken } from 'utils/units/knownTokens'

// we can't stake the full amount because of fees; when the user maxes out
// we stake 99.99% of the balance so there's room to cover fees.
const STAKING_MAX_BALANCE_PERCENTAGE = 0.9999

// Dial granularity. 0.1 keeps swiping controllable — at 0.01 every pixel of
// drag crossed several steps, making it hard to land on an intended amount.
// Manual input is NOT snapped to this (typed values keep their 2-decimal
// precision; only drag/preset values snap). Passing `step` explicitly still
// matters: without it the dial derives `max(0.1, max/1000)`, which grows
// coarser than 0.1 on large balances. Known trade-off on small balances
// (~2 AVAX): the preset-highlight tolerance (`step / max`) widens to ~5% of
// the arc, so a value near a chip's fraction can light the chip up slightly
// early.
const STAKING_DIAL_STEP = 0.1

// P-chain AVAX has 9 decimals; used to convert the dial's plain number back
// into a TokenUnit (the rest of the stake flow speaks TokenUnit). We bridge
// through a fixed-decimal string + big.js (`stringToBigint`) rather than
// `avax * 1e9` so we never compound double-rounding error in the multiply —
// the old path was only exact while `avax * 1e9` stayed under
// Number.MAX_SAFE_INTEGER (~9M AVAX). `toFixed` caps at nAVAX precision so
// big.js never has to round.
const avaxToTokenUnit = (avax: number): TokenUnit =>
  new TokenUnit(
    stringToBigint(
      avax.toFixed(xpChainToken.maxDecimals),
      xpChainToken.maxDecimals
    ),
    xpChainToken.maxDecimals,
    xpChainToken.symbol
  )

/**
 * V2 "How much do you want to stake?" screen.
 *
 * Designed to be shared across staking flows (Fast Stake today; the
 * advanced delegate flow once it lands). Where to navigate on `Next` is
 * injected via the `nextRoute` prop so each flow's route wrapper can
 * point at its own duration step (`/addStakeV2/fastStake/duration`,
 * `/addStakeV2/delegate/duration`, etc.).
 */
const StakeAmountScreen = ({
  nextRoute
}: {
  /** Pathname pushed onto the router when the user presses `Next`. */
  nextRoute: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()

  const [isComputing, setIsComputing] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const { computeSteps } = useDelegationContext()
  const [stakeAmount, setStakeAmount] = useStakeAmount()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const fetchingBalance = cChainBalance === undefined
  const claimableBalance = useGetClaimableBalance()
  const stuckBalance = useGetStuckBalance()
  const cumulativeBalance = useMemo(
    () => cChainBalance?.add(claimableBalance || 0).add(stuckBalance || 0),
    [cChainBalance, claimableBalance, stuckBalance]
  )
  const amountNotEnough =
    !stakeAmount.isZero() && stakeAmount.lt(minStakeAmount)
  const notEnoughBalance = cumulativeBalance?.lt(stakeAmount) ?? true
  const inputValid =
    !amountNotEnough && !notEnoughBalance && !stakeAmount.isZero()
  const avaxPrice = useAvaxPrice()
  const { formatCurrency } = useFormatCurrency()

  const isFastStakeFeeBlocked = useSelector(selectIsFastStakeFeeBlocked)
  const isFastStakeFeeEnabled = !isFastStakeFeeBlocked
  // Flag-driven (multivariate variant in bps, 10% fallback) — see
  // `selectFastStakeFeeRate`.
  const fastStakeFeeRate = useSelector(selectFastStakeFeeRate)

  // This screen doesn't know the stake duration yet (it's picked on the next
  // screen), so reserve room for the fee at the MAX duration (1y) — the
  // worst case. Since the convenience fee is a fraction of the gross reward
  // and the reward is linear in the stake, `fee / stake` is a constant
  // multiplier (mirrors core-web's `feeMultiplier`). We probe it once at the
  // minimum stake and the max duration; any shorter duration the user later
  // picks yields a smaller fee, so the confirm step can always afford it.
  const maxStakeDurationSeconds = useMemo(
    () =>
      Seconds(
        Math.max(
          0,
          Math.floor((getMaximumStakeEndDate().getTime() - Date.now()) / 1000)
        )
      ),
    []
  )
  const { data: referenceReward } = useStakeEstimatedReward({
    amount: minStakeAmount,
    // Skip the estimate (and its network round-trip) when the fee is off.
    duration: isFastStakeFeeEnabled ? maxStakeDurationSeconds : undefined,
    delegationFee: 0
  })
  const feeMultiplier = useMemo(() => {
    if (!isFastStakeFeeEnabled) return 0
    const reward = referenceReward?.estimatedTokenReward
    const minStake = minStakeAmount.toDisplay({ asNumber: true })
    if (!reward || minStake <= 0) return 0
    return (reward.toDisplay({ asNumber: true }) * fastStakeFeeRate) / minStake
  }, [isFastStakeFeeEnabled, fastStakeFeeRate, referenceReward, minStakeAmount])

  const formatInCurrency = useCallback(
    (amount: TokenUnit): string => {
      return formatCurrency({
        amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
      })
    },
    [avaxPrice, formatCurrency]
  )

  const handleAmountChange = useCallback(
    (value: number) => {
      const next = avaxToTokenUnit(value)
      if (next.eq(stakeAmount)) return
      setStakeAmount(next)
    },
    [stakeAmount, setStakeAmount]
  )

  const handlePressNext = useCallback(async () => {
    setIsComputing(true)

    try {
      await computeSteps(stakeAmount.toSubUnit())

      AnalyticsService.capture('StakeOpenDurationSelect')
      navigate(nextRoute as Href)
    } catch (e) {
      setError(e as Error)
    }

    setIsComputing(false)
  }, [stakeAmount, computeSteps, navigate, nextRoute])

  useEffect(() => {
    if (amountNotEnough) {
      setError(
        new Error(
          `Minimum amount to stake is ${minStakeAmount.toString()} AVAX`
        )
      )
    } else if (notEnoughBalance) {
      setError(
        new Error('The specified stake amount exceeds the available balance')
      )
    } else {
      setError(null)
    }
  }, [amountNotEnough, notEnoughBalance, minStakeAmount])

  const renderFooter = useCallback(() => {
    return (
      <Button
        testID={isComputing || !inputValid ? 'next_btn_disabled' : 'next_btn'}
        accessible={true}
        type="primary"
        size="large"
        disabled={isComputing || !inputValid}
        onPress={handlePressNext}>
        {isComputing ? <ActivityIndicator /> : 'Next'}
      </Button>
    )
  }, [handlePressNext, inputValid, isComputing])

  const dialValue = useMemo(
    () => stakeAmount.toDisplay({ asNumber: true }),
    [stakeAmount]
  )

  const dialMax = useMemo(() => {
    // `* 0.9999` keeps the existing headroom for network fees; dividing by
    // `(1 + feeMultiplier)` additionally reserves the convenience fee so
    // `stake + fee` fits the balance (balance ≥ stake × (1 + feeMultiplier)).
    const base =
      (cumulativeBalance?.toDisplay({ asNumber: true }) ?? 0) *
      STAKING_MAX_BALANCE_PERCENTAGE
    return base / (1 + feeMultiplier)
  }, [cumulativeBalance, feeMultiplier])

  const dialMin = useMemo(() => {
    const min = minStakeAmount.toDisplay({ asNumber: true })
    // The dial requires `0 ≤ min ≤ max`. When the stakeable max dips below the
    // minimum stake (low balance, or the fee reservation shrinking `dialMax`
    // below the minimum — common on testnet where the fee multiplier is
    // large), passing `min > max` makes the dial warn and drop the reference
    // tick. Clamp so we never violate the contract; the screen still enforces
    // the real minimum via validation.
    return Math.min(min, dialMax)
  }, [minStakeAmount, dialMax])

  if (fetchingBalance || cumulativeBalance === undefined) {
    return <ActivityIndicator sx={{ flex: 1 }} />
  }

  const renderCaption = (): JSX.Element => {
    const errorMessage = error?.message
    return (
      <Text
        variant="caption"
        sx={{
          marginTop: 8,
          paddingHorizontal: 36,
          color: errorMessage
            ? '$textDanger'
            : alpha(colors.$textPrimary, 0.85),
          alignSelf: 'center',
          textAlign: 'center'
        }}>
        {errorMessage
          ? normalizeErrorMessage(errorMessage)
          : // Show the stakeable max (balance minus the network-fee headroom
            // and the reserved convenience fee), not the raw balance — this is
            // the same figure the dial's `max`/percent presets are relative to,
            // so "50%", "Max", etc. line up with the number shown here (mirrors
            // core-web, which labels the adjusted max as the available amount).
            `Available to stake: ${avaxToTokenUnit(dialMax).toDisplay()} ${
              xpChainToken.symbol
            }`}
      </Text>
    )
  }

  return (
    <ScrollScreen
      title={`How much do you\nwant to stake?`}
      navigationTitle="How much do you want to stake?"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16 }}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18,
          paddingVertical: 24,
          marginTop: 8
        }}>
        <CircularDial
          value={dialValue}
          onChange={handleAmountChange}
          max={dialMax}
          min={dialMin}
          step={STAKING_DIAL_STEP}
          decimals={2}
          maxDecimals={2}
          label={xpChainToken.symbol}
          caption={formatInCurrency(stakeAmount)}
          enableManualInput
        />
      </View>
      {renderCaption()}
    </ScrollScreen>
  )
}

export default StakeAmountScreen
