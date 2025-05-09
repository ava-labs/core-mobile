import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  GroupListItem,
  showAlert,
  TokenUnitInput,
  TokenUnitInputHandle,
  Tooltip,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SendErrorMessage } from 'common/hooks/send/utils/types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { transactionSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

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

    transactionSnackbar.success({ message: 'Stake reward claimed' })
    setTimeout(() => {
      confetti.restart()
    }, 100)
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
          text: 'Cancel',
          onPress: back
        },
        {
          text: 'Try again',
          onPress: issueClaimRewards
        }
      ]
    })
  }

  const {
    mutation: claimRewardsMutation,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck)

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

  const handleCancel = useCallback(() => {
    AnalyticsService.capture('StakeCancelClaim')

    // we call back() first and then navigate() to prevent rerendering the stake home screen when user is already on it.
    back()
    // @ts-ignore TODO: make routes typesafe
    navigate('/stake')
  }, [back, navigate])

  const issueClaimRewards = useCallback(() => {
    AnalyticsService.capture('StakeIssueClaim')
    claimRewardsMutation.mutate()
  }, [claimRewardsMutation])

  const formatInCurrency = useCallback(
    (amount: TokenUnit): string => {
      return formatTokenInCurrency({
        amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
      })
    },
    [avaxPrice, formatTokenInCurrency]
  )

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
        buttons: [{ text: 'Go back', onPress: back }]
      })
    }
  }, [data, back])

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 16
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
    )
  }, [
    claimRewardsMutation.isPending,
    handleCancel,
    issueClaimRewards,
    shouldDisableClaimButton
  ])

  return (
    <ScrollScreen
      title="Claim your staking reward"
      isModal
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ gap: 12 }}>
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
            autoFocus
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
    </ScrollScreen>
  )
}

export default ClaimStakeRewardScreen
