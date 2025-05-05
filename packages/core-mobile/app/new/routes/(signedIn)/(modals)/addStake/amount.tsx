import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  normalizeErrorMessage,
  Text,
  TokenUnitInputWidget,
  useTheme
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useDelegationContext } from 'contexts/DelegationContext'
import { useRouter } from 'expo-router'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { cChainToken, xpChainToken } from 'utils/units/knownTokens'

const StakeAmountScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()

  const [isComputing, setIsComputing] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const { compute, setStakeAmount, stakeAmount } = useDelegationContext()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const cChainBalanceAvax = useMemo(
    () =>
      cChainBalance?.data?.balance
        ? new TokenUnit(
            cChainBalance?.data?.balance || 0,
            cChainToken.maxDecimals,
            cChainToken.symbol
          )
        : undefined,
    [cChainBalance?.data?.balance]
  )
  const fetchingBalance = cChainBalance?.data?.balance === undefined
  const claimableBalance = useGetClaimableBalance()
  const stuckBalance = useGetStuckBalance()
  const cumulativeBalance = useMemo(
    () => cChainBalanceAvax?.add(claimableBalance || 0).add(stuckBalance || 0),
    [cChainBalanceAvax, claimableBalance, stuckBalance]
  )
  const amountNotEnough =
    !stakeAmount.isZero() && stakeAmount.lt(minStakeAmount)
  const notEnoughBalance = cumulativeBalance?.lt(stakeAmount) ?? true
  const inputValid =
    !amountNotEnough && !notEnoughBalance && !stakeAmount.isZero()
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const { formatCurrency } = useFormatCurrency()

  const handleAmountChange = useCallback(
    (amount: TokenUnit) => {
      if (amount.eq(stakeAmount)) return

      setStakeAmount(amount)
    },
    [stakeAmount, setStakeAmount]
  )

  const handlePressNext = useCallback(async () => {
    setIsComputing(true)

    try {
      await compute(stakeAmount.toSubUnit())

      AnalyticsService.capture('StakeOpenDurationSelect')
      // @ts-ignore TODO: make routes typesafe
      navigate('/addStake/duration')
    } catch (e) {
      setError(e as Error)
    }

    setIsComputing(false)
  }, [stakeAmount, compute, navigate])

  const formatInCurrency = useCallback(
    (amount: TokenUnit): string => {
      return formatCurrency({
        amount: amount.mul(avaxPrice).toDisplay({ asNumber: true }),
        withCurrencySuffix: true
      })
    },
    [avaxPrice, formatCurrency]
  )

  useEffect(() => {
    if (amountNotEnough) {
      setError(
        new Error(
          `Minimum amount to stake is ${minStakeAmount.toString()} AVAX`
        )
      )
    } else if (notEnoughBalance) {
      setError(
        new Error('The specified staking amount exceeds the available balance')
      )
    } else {
      setError(null)
    }
  }, [amountNotEnough, notEnoughBalance, minStakeAmount])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="large"
        disabled={isComputing || !inputValid}
        onPress={handlePressNext}>
        {isComputing ? <ActivityIndicator /> : 'Next'}
      </Button>
    )
  }, [handlePressNext, inputValid, isComputing])

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
      title={`How much would\nyou like to stake?`}
      navigationTitle="How much would you like to stake?"
      renderFooter={renderFooter}
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16 }}>
      <TokenUnitInputWidget
        disabled={isComputing}
        balance={cumulativeBalance}
        token={xpChainToken}
        formatInCurrency={formatInCurrency}
        onChange={handleAmountChange}
        maxPercentage={STAKING_MAX_BALANCE_PERCENTAGE}
        autoFocus
      />
      {renderCaption()}
    </ScrollScreen>
  )
}

// we can't stake the full amount because of fees
// to give a good user experience, when user presses max
// we will stake 99.99% of the balance
// this is to ensure that the user has enough balance to cover the fees
const STAKING_MAX_BALANCE_PERCENTAGE = 0.9999

export default StakeAmountScreen
