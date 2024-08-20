import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import Separator from 'components/Separator'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { showSimpleToast } from 'components/Snackbar'
import { useClaimFees } from 'hooks/earn/useClaimFees'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'
import { useTimeElapsed } from 'hooks/time/useTimeElapsed'
import Spinner from 'components/animation/Spinner'
import { timeToShowNetworkFeeError } from 'consts/earn'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Avax } from 'types'
import { ConfirmScreen } from './components/ConfirmScreen'
import { EmptyClaimRewards } from './EmptyClaimRewards'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.ClaimRewards>

const ClaimRewards = (): JSX.Element | null => {
  const { theme } = useApplicationContext()
  const { navigate, goBack } = useNavigation<ScreenProps['navigation']>()
  const onBack = useRoute<ScreenProps['route']>().params?.onBack
  const { data } = usePChainBalance()
  const { totalFees } = useClaimFees()
  const avaxFormatter = useAvaxFormatter()
  const claimRewardsMutation = useClaimRewards(
    onClaimSuccess,
    onClaimError,
    onFundsStuck
  )
  const isFocused = useIsFocused()
  const unableToGetFees = totalFees === undefined
  const showFeeError = useTimeElapsed(
    isFocused && unableToGetFees, // re-enable this checking whenever this screen is focused
    timeToShowNetworkFeeError
  )

  useEffect(() => {
    if (showFeeError) {
      navigate(AppNavigation.Earn.FeeUnavailable)
    }
  }, [navigate, showFeeError])

  if (!data) {
    return null
  }

  if (
    data.balancePerType.unlockedUnstaked === undefined ||
    data.balancePerType.unlockedUnstaked === 0
  ) {
    return <EmptyClaimRewards />
  }

  const [claimableAmountInAvax, claimableAmountInCurrency] = avaxFormatter(
    Avax.fromBase(data.balancePerType.unlockedUnstaked),
    true
  )

  const [feesInAvax, feesInCurrency] = avaxFormatter(totalFees, true)

  const cancelClaim = (): void => {
    AnalyticsService.capture('StakeCancelClaim')
    if (onBack) {
      onBack()
    } else {
      goBack()
    }
  }

  const renderFees = (): JSX.Element => {
    if (unableToGetFees) {
      return <Spinner size={22} />
    }

    return (
      <View
        style={{
          alignItems: 'flex-end',
          marginTop: -4
        }}>
        <AvaText.Heading6 testID="network_fee">
          {feesInAvax} AVAX
        </AvaText.Heading6>
        <Space y={4} />
        <AvaText.Body3 testID="network_fee_currency" color={theme.colorText2}>
          {feesInCurrency}
        </AvaText.Body3>
      </View>
    )
  }

  function onFundsStuck(): void {
    navigate(AppNavigation.Earn.FundsStuck, {
      onTryAgain: () => issueClaimRewards()
    })
  }

  const issueClaimRewards = (): void => {
    AnalyticsService.capture('StakeIssueClaim')
    claimRewardsMutation.mutate()
  }

  function onClaimSuccess(): void {
    AnalyticsService.capture('StakeClaimSuccess')
    goBack()
  }

  function onClaimError(error: Error): void {
    AnalyticsService.capture('StakeClaimFail')
    showSimpleToast(error.message)
  }

  return (
    <ConfirmScreen
      isConfirming={claimRewardsMutation.isPending}
      onConfirm={issueClaimRewards}
      onCancel={cancelClaim}
      header="Claim Rewards"
      confirmBtnTitle="Claim Now"
      cancelBtnTitle="Cancel"
      confirmBtnDisabled={unableToGetFees}>
      <View style={styles.verticalPadding}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Claimable Amount</AvaText.Body2>
          <AvaText.Heading1
            textStyle={{ marginTop: -2 }}
            testID="claimable_balance">
            {claimableAmountInAvax + ' AVAX'}
          </AvaText.Heading1>
        </Row>
        <Space y={4} />
        <AvaText.Heading3
          textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}
          testID="claimable_balance_currency">
          {claimableAmountInCurrency}
        </AvaText.Heading3>
      </View>
      <Separator />

      <Row
        style={{
          paddingVertical: 16,
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
        <Tooltip
          content="Fees paid to execute the transaction"
          position="right"
          style={{ width: 180 }}>
          Network Fee
        </Tooltip>
        {renderFees()}
      </Row>
    </ConfirmScreen>
  )
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})

export default ClaimRewards
