import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  SafeAreaView,
  ScrollView,
  showAlert,
  Tooltip,
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
import { transactionSnackbar } from 'common/utils/toast'
import { TokenUnitInput, TokenUnitInputHandle } from '@avalabs/k2-alpine'
import { useConfetti } from 'common/contexts/ConfettiContext'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'

const ClaimStakeRewardScreen = (): JSX.Element => {
  const { navigate, back } = useRouter()
  const { formatTokenInCurrency } = useFormatCurrency()
  const { data } = usePChainBalance()
  const ref = useRef<TokenUnitInputHandle>(null)
  const [claimableAmountInAvax, setClaimableAmountInAvax] =
    useState<TokenUnit>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const onClaimSuccess = (): void => {
    AnalyticsService.capture('StakeClaimSuccess')

    confetti.restart()
    transactionSnackbar.success({ message: 'Stake reward claimed' })

    // this is a workaround for the issue where back navigation is not working,
    // when it's called within the onSuccess callback of the mutation
    setTimeout(() => {
      back()
    }, 300)
  }

  const onClaimError = (error: Error): void => {
    AnalyticsService.capture('StakeClaimFail')
    transactionSnackbar.error({ error: error.message })
  }

  const onFundsStuck = (): void => {
    showAlert({
      title: 'Claim Failed',
      description:
        'Your transaction failed due to network issues. Would you like to try again?',
      buttons: [
        {
          text: 'Try again',
          onPress: issueClaimRewards
        },
        {
          text: 'Cancel',
          onPress: back
        }
      ]
    })
  }

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

  const handleCancel = (): void => {
    AnalyticsService.capture('StakeCancelClaim')

    // we call back() first and then navigate() to prevent rerendering the stake home screen when user is already on it.
    back()

    navigate('/stake')
  }

  const issueClaimRewards = (): void => {
    AnalyticsService.capture('StakeIssueClaim')
    claimRewardsMutation.mutate()
  }

  const formatInCurrency = (amount: TokenUnit): string => {
    return formatTokenInCurrency({
      amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
    })
  }

  const feeData: GroupListItem[] = useMemo(
    () => [
      {
        title: 'Network fee',
        rightIcon: (
          <Tooltip
            title="Network fee"
            description="Fees paid to execute the transaction"
          />
        ),
        value:
          totalFees === undefined ? (
            <ActivityIndicator />
          ) : (
            <StakeTokenUnitValue value={totalFees} />
          )
      }
    ],
    [totalFees]
  )

  usePreventScreenRemoval(claimRewardsMutation.isPending)

  useEffect(() => {
    if (claimableAmountInAvax) {
      ref.current?.setValue(claimableAmountInAvax.toDisplay())
    }
  }, [claimableAmountInAvax])

  useEffect(() => {
    if (data && data.balancePerType.unlockedUnstaked === undefined) {
      showAlert({
        title: 'No claimable balance',
        description: 'You have no balance available for claiming.',
        buttons: [{ text: 'Go back', style: 'cancel', onPress: back }]
      })
    }
  }, [data, back])

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
            <TokenUnitInput
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
          <GroupList
            itemHeight={60}
            data={feeData}
            textContainerSx={{
              marginTop: 0
            }}
          />
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
