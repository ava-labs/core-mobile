import React, { useState, useEffect, useRef } from 'react'
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { useRouter } from 'expo-router'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { SendErrorMessage } from 'screens/send/utils/types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { showSnackbar } from 'common/utils/toast'
import {
  TokenAmountInput,
  TokenAmountInputHandle
} from '@avalabs/k2-alpine/src/components/TokenAmountInput/TokenAmountInput'
import { useConfetti } from 'common/contexts/ConfettiContext'

const ClaimStakeRewardScreen = (): JSX.Element => {
  const { back } = useRouter()
  const { formatTokenInCurrency } = useFormatCurrency()
  //   const onBack = useRoute<ScreenProps['route']>().params?.onBack
  const { data } = usePChainBalance()
  const ref = useRef<TokenAmountInputHandle>(null)
  const [claimableAmountInAvax, setClaimableAmountInAvax] =
    useState<TokenUnit>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const {
    mutation: claimRewardsMutation,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck)
  const confetti = useConfetti()
  const unableToGetFees = totalFees === undefined

  const insufficientBalanceForFee =
    feeCalculationError === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE

  const shouldDisableClaimButton =
    unableToGetFees ||
    insufficientBalanceForFee ||
    claimRewardsMutation.isPending

  useEffect(() => {
    if (claimRewardsMutation.isPending) return

    // the balance is usually updated faster than the tx "committed" event
    // and we don't want to show the updated balance while the tx is still pending (spinner is being displayed)
    // as that might confuse the user
    // thus, we only update the balance if the tx is not pending
    if (data?.balancePerType.unlockedUnstaked) {
      const unlockedInUnit = new TokenUnit(
        data.balancePerType.unlockedUnstaked,
        pNetwork.networkToken.decimals,
        pNetwork.networkToken.symbol
      )

      setClaimableAmountInAvax(unlockedInUnit)
    }
  }, [
    data?.balancePerType.unlockedUnstaked,
    pNetwork.networkToken,
    claimRewardsMutation.isPending
  ])

  // const [feesInAvax, formattedFeesInCurrency] = useMemo(() => {
  //   if (totalFees === undefined) {
  //     return [UNKNOWN_AMOUNT, UNKNOWN_AMOUNT]
  //   }

  //   return [
  //     totalFees.toDisplay({ fixedDp: 10 }),
  //     formatTokenInCurrency({
  //       amount: totalFees.mul(avaxPrice).toDisplay({ asNumber: true })
  //     })
  //   ]
  // }, [avaxPrice, totalFees, formatTokenInCurrency])

  const handleCancel = (): void => {
    AnalyticsService.capture('StakeCancelClaim')
    back()
  }

  // const renderFees = (): JSX.Element => {
  //   if (unableToGetFees) {
  //     return <Spinner size={22} />
  //   }

  //   return (
  //     <View
  //       style={{
  //         alignItems: 'flex-end',
  //         marginTop: -4
  //       }}>
  //       <AvaText.Heading6 testID="network_fee">
  //         {feesInAvax} AVAX
  //       </AvaText.Heading6>
  //       <Space y={4} />
  //       <AvaText.Body3 testID="network_fee_currency" color={theme.colorText2}>
  //         {formattedFeesInCurrency}
  //       </AvaText.Body3>
  //     </View>
  //   )
  // }

  function onFundsStuck(): void {
    // navigate(AppNavigation.Earn.ClaimFundsStuck, {
    //   onTryAgain: () => issueClaimRewards()
    // })
  }

  const issueClaimRewards = (): void => {
    // AnalyticsService.capture('StakeIssueClaim')
    // claimRewardsMutation.mutate()
    setTimeout(() => {
      confetti.restart()
      showSnackbar('Stake reward claimed')

      back()
    }, 1000)
  }

  function onClaimSuccess(): void {
    AnalyticsService.capture('StakeClaimSuccess')
    back()
  }

  function onClaimError(error: Error): void {
    AnalyticsService.capture('StakeClaimFail')
    showSnackbar(error.message)
  }

  const formatInCurrency = (amount: TokenUnit): string => {
    return formatTokenInCurrency({
      amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
    })
  }

  usePreventScreenRemoval(claimRewardsMutation.isPending)

  useEffect(() => {
    if (claimableAmountInAvax) {
      ref.current?.setValue(claimableAmountInAvax.toDisplay())
    }
  }, [claimableAmountInAvax])

  // if (!data) {
  //   return null
  // }

  // if (data.balancePerType.unlockedUnstaked === undefined) {
  //   return <EmptyClaimRewards />
  // }

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerSx={{ padding: 16, paddingTop: 0 }}>
        <ScreenHeader title="Claim your staking reward" />
        <View sx={{ gap: 12, marginTop: 16 }}>
          <View
            sx={{
              backgroundColor: '$surfaceSecondary',
              paddingVertical: 30,
              paddingHorizontal: 16,
              borderRadius: 12
            }}>
            <TokenAmountInput
              ref={ref}
              amount={claimableAmountInAvax}
              editable={false}
              token={{
                maxDecimals: pNetwork.networkToken.decimals,
                symbol: pNetwork.networkToken.symbol
              }}
              formatInCurrency={formatInCurrency}
            />
          </View>
        </View>
      </ScrollView>
      <View
        sx={{
          padding: 16,
          gap: 16,
          backgroundColor: '$surfacePrimary'
        }}>
        <Button
          type="primary"
          size="large"
          onPress={issueClaimRewards}
          disabled={shouldDisableClaimButton}>
          {claimRewardsMutation.isPending ? <ActivityIndicator /> : 'Claim now'}
        </Button>
        <Button
          type="tertiary"
          size="large"
          onPress={handleCancel}
          disabled={claimRewardsMutation.isPending}>
          Cancel
        </Button>
      </View>
    </SafeAreaView>
  )
}

export default ClaimStakeRewardScreen
