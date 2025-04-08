import React, { useMemo, useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  TokenAmountInputWidget,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { cChainToken, xpChainToken } from 'utils/units/knownTokens'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import { useDelegationContext } from 'contexts/DelegationContext'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useRouter } from 'expo-router'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'

const StakeAmountScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const [isComputing, setIsComputing] = useState<boolean>(false)
  const [computeError, setComputeError] = useState<Error | null>(null)
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

  const validateInputAmount = useCallback(async (): Promise<void> => {
    if (amountNotEnough) {
      throw new Error(
        `Minimum amount to stake is ${minStakeAmount.toString()} AVAX`
      )
    }

    if (notEnoughBalance) {
      throw new Error(
        'The specified staking amount exceeds the available balance'
      )
    }

    if (computeError) {
      throw computeError
    }
  }, [amountNotEnough, notEnoughBalance, minStakeAmount, computeError])

  const handleAmountChange = useCallback(
    (amount: TokenUnit) => {
      if (amount.eq(stakeAmount)) return

      computeError && setComputeError(null)
      setStakeAmount(amount)
    },
    [computeError, stakeAmount, setStakeAmount]
  )

  const handlePressNext = useCallback(async () => {
    setIsComputing(true)
    setComputeError(null)

    try {
      await compute(stakeAmount.toSubUnit())

      // AnalyticsService.capture('StakeOpenDurationSelect')
      navigate('/addStake/duration')
    } catch (e) {
      setComputeError(e as Error)
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

  if (fetchingBalance || cumulativeBalance === undefined) {
    return <ActivityIndicator sx={{ flex: 1 }} />
  }

  return (
    <KeyboardAvoidingView>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerSx={{ padding: 16, paddingTop: 0 }}>
          <ScreenHeader title="How much would you like to stake?" />
          <TokenAmountInputWidget
            sx={{
              marginTop: 16
            }}
            disabled={isComputing}
            balance={cumulativeBalance}
            token={xpChainToken}
            formatInCurrency={formatInCurrency}
            validateAmount={validateInputAmount}
            onChange={handleAmountChange}
            maxPercentage={STAKING_MAX_BALANCE_PERCENTAGE}
          />
        </ScrollView>
        <View
          sx={{
            padding: 16
          }}>
          <Button
            type="primary"
            size="large"
            disabled={isComputing || !inputValid}
            onPress={handlePressNext}>
            {isComputing ? <ActivityIndicator /> : 'Next'}
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

// we can't stake the full amount because of fees
// to give a good user experience, when user presses max
// we will stake 99.99% of the balance
// this is to ensure that the user has enough balance to cover the fees
const STAKING_MAX_BALANCE_PERCENTAGE = 0.9999

export default StakeAmountScreen
