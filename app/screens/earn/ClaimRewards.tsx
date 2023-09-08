import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import Separator from 'components/Separator'
import AvaText from 'components/AvaText'
import { Popable } from 'react-native-popable'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { Row } from 'components/Row'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { useNAvaxFormatter } from 'hooks/formatter/useNAvaxFormatter'
import { Space } from 'components/Space'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { showSimpleToast } from 'components/Snackbar'
import { useClaimFees } from 'hooks/earn/useClaimFees'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'
import { useTimeElapsed } from 'hooks/time/useTimeElapsed'
import Spinner from 'components/animation/Spinner'
import { timeToShowNetworkFeeError } from 'consts/earn'
import { ConfirmScreen } from './components/ConfirmScreen'
import { EmptyClaimRewards } from './EmptyClaimRewards'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.ClaimRewards>

const onClaimError = (error: Error) => {
  showSimpleToast(error.message)
}

const ClaimRewards = () => {
  const { theme } = useApplicationContext()
  const { navigate, goBack } = useNavigation<ScreenProps['navigation']>()
  const onBack = useRoute<ScreenProps['route']>().params?.onBack
  const activeNetwork = useSelector(selectActiveNetwork)
  const { data } = usePChainBalance()
  const { totalFees } = useClaimFees()
  const nAvaxFormatter = useNAvaxFormatter()
  const avaxFormatter = useAvaxFormatter()
  const claimRewardsMutation = useClaimRewards(
    goBack,
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

  if (data.unlockedUnstaked[0]?.amount === undefined) {
    return <EmptyClaimRewards />
  }

  const tokenSymbol = activeNetwork.networkToken.symbol

  const [claimableAmountInAvax, claimableAmountInCurrency] = nAvaxFormatter(
    data.unlockedUnstaked[0]?.amount,
    true
  )

  const [feesInAvax, feesInCurrency] = avaxFormatter(totalFees, true)

  const handleGoBack = () => {
    if (onBack) {
      onBack()
    } else {
      goBack()
    }
  }

  const renderFees = () => {
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

  function onFundsStuck() {
    navigate(AppNavigation.Earn.FundsStuck, {
      onTryAgain: () => issueClaimRewards()
    })
  }

  const issueClaimRewards = () => {
    claimRewardsMutation.mutate()
  }

  return (
    <ConfirmScreen
      isConfirming={claimRewardsMutation.isPending}
      onConfirm={issueClaimRewards}
      onCancel={handleGoBack}
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
            {claimableAmountInAvax + ' ' + tokenSymbol}
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
        <Popable
          content={
            <PopableContent message={'Fees paid to execute the transaction'} />
          }
          position="right"
          strictPosition={true}
          style={{ minWidth: 180 }}
          backgroundColor={theme.neutral100}>
          <PopableLabel label="Network Fee" />
        </Popable>
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
