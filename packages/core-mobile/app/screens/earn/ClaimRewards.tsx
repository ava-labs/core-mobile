import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useNavigation, useRoute } from '@react-navigation/native'
import Separator from 'components/Separator'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { showSimpleToast } from 'components/Snackbar'
import Spinner from 'components/animation/Spinner'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { ChainId } from '@avalabs/core-chains-sdk'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { SendErrorMessage } from 'screens/send/utils/types'
import { Text } from '@avalabs/k2-mobile'
import { EmptyClaimRewards } from './EmptyClaimRewards'
import { ConfirmScreen } from './components/ConfirmScreen'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.ClaimRewards>

const ClaimRewards = (): JSX.Element | null => {
  const { theme, appHook } = useApplicationContext()
  const { navigate, goBack } = useNavigation<ScreenProps['navigation']>()
  const onBack = useRoute<ScreenProps['route']>().params?.onBack
  const { data } = usePChainBalance()
  const [claimableAmountInAvax, setClaimableAmountInAvax] =
    useState<string>(UNKNOWN_AMOUNT)
  const [
    formattedClaimableAmountInCurrency,
    setFormattedClaimableAmountInCurrency
  ] = useState<string>(UNKNOWN_AMOUNT)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const { getNetwork } = useNetworks()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const avaxNetwork = getNetwork(ChainId.AVALANCHE_MAINNET_ID)
  const { nativeTokenPrice: avaxPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const {
    mutation: claimRewardsMutation,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck)

  const unableToGetFees = totalFees === undefined

  const insufficientBalanceForFee =
    feeCalculationError === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE

  const shouldDisableClaimButton = unableToGetFees || insufficientBalanceForFee

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

      setClaimableAmountInAvax(unlockedInUnit.toDisplay())
      setFormattedClaimableAmountInCurrency(
        appHook.tokenInCurrencyFormatter(
          unlockedInUnit.mul(avaxPrice).toDisplay({ asNumber: true })
        )
      )
    }
  }, [
    data?.balancePerType.unlockedUnstaked,
    avaxPrice,
    pNetwork.networkToken.decimals,
    pNetwork.networkToken.symbol,
    appHook,
    claimRewardsMutation.isPending
  ])

  const [feesInAvax, formattedFeesInCurrency] = useMemo(() => {
    if (totalFees === undefined) {
      return [UNKNOWN_AMOUNT, UNKNOWN_AMOUNT]
    }

    return [
      totalFees.toDisplay({ fixedDp: 10 }),
      appHook.tokenInCurrencyFormatter(
        totalFees.mul(avaxPrice).toDisplay({ asNumber: true })
      )
    ]
  }, [avaxPrice, totalFees, appHook])

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
          {formattedFeesInCurrency}
        </AvaText.Body3>
      </View>
    )
  }

  function onFundsStuck(): void {
    navigate(AppNavigation.Earn.ClaimFundsStuck, {
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

  if (!data) {
    return null
  }

  if (data.balancePerType.unlockedUnstaked === undefined) {
    return <EmptyClaimRewards />
  }

  return (
    <ConfirmScreen
      isConfirming={claimRewardsMutation.isPending}
      onConfirm={issueClaimRewards}
      onCancel={cancelClaim}
      header="Claim Rewards"
      confirmBtnTitle="Claim Now"
      cancelBtnTitle="Cancel"
      confirmBtnDisabled={shouldDisableClaimButton}>
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
          {formattedClaimableAmountInCurrency}
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
      {!claimRewardsMutation.isPending && insufficientBalanceForFee && (
        <Text
          testID="insufficent_balance_error_msg"
          variant="body2"
          sx={{ color: '$dangerMain' }}>
          {SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE}
        </Text>
      )}
    </ConfirmScreen>
  )
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})

export default ClaimRewards
