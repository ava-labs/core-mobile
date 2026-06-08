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
import { Route, useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import useStakingParams from 'hooks/earn/useStakingParams'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { stringToBigint } from 'utils/bigNumbers/stringToBigint'
import { xpChainToken } from 'utils/units/knownTokens'

// we can't stake the full amount because of fees; when the user maxes out
// we stake 99.99% of the balance so there's room to cover fees.
const STAKING_MAX_BALANCE_PERCENTAGE = 0.9999

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
  nextRoute: Route
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
      navigate(nextRoute)
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

  const dialMax = useMemo(
    () =>
      (cumulativeBalance?.toDisplay({ asNumber: true }) ?? 0) *
      STAKING_MAX_BALANCE_PERCENTAGE,
    [cumulativeBalance]
  )

  const dialMin = useMemo(
    () => minStakeAmount.toDisplay({ asNumber: true }),
    [minStakeAmount]
  )

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
          : `Balance: ${cumulativeBalance.toDisplay()} ${xpChainToken.symbol}`}
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
