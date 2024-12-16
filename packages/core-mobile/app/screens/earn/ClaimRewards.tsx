import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useTimeElapsed } from 'hooks/time/useTimeElapsed'
import Spinner from 'components/animation/Spinner'
import { timeToShowNetworkFeeError } from 'consts/earn'
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
import { isDevnet } from 'utils/isDevnet'
import { selectActiveNetwork } from 'store/network'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { Eip1559Fees } from 'utils/Utils'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { SendErrorMessage } from 'screens/send/utils/types'
import { Text } from '@avalabs/k2-mobile'
import { useIsNetworkFeeExcessive } from 'hooks/earn/useIsNetworkFeeExcessive'
import { EmptyClaimRewards } from './EmptyClaimRewards'
import { ConfirmScreen } from './components/ConfirmScreen'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.ClaimRewards>

const ClaimRewards = (): JSX.Element | null => {
  const { theme, appHook } = useApplicationContext()
  const { navigate, goBack } = useNavigation<ScreenProps['navigation']>()
  const onBack = useRoute<ScreenProps['route']>().params?.onBack
  const { data } = usePChainBalance()
  const xpProvider = useAvalancheXpProvider()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeNetwork = useSelector(selectActiveNetwork)
  const pNetwork = NetworkService.getAvalancheNetworkP(
    isDeveloperMode,
    isDevnet(activeNetwork)
  )
  const [gasPrice, setGasPrice] = useState<bigint>()
  const { getNetwork } = useNetworks()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const avaxNetwork = getNetwork(ChainId.AVALANCHE_MAINNET_ID)
  const { nativeTokenPrice: avaxPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const {
    mutation: claimRewardsMutation,
    defaultTxFee,
    totalFees,
    feeCalculationError
  } = useClaimRewards(onClaimSuccess, onClaimError, onFundsStuck, gasPrice)
  const isFocused = useIsFocused()
  const unableToGetFees = totalFees === undefined
  const excessiveNetworkFee = useIsNetworkFeeExcessive(gasPrice)
  const showFeeError = useTimeElapsed(
    isFocused && unableToGetFees, // re-enable this checking whenever this screen is focused
    timeToShowNetworkFeeError
  )
  const insufficientBalanceForFee =
    feeCalculationError === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE

  const shouldDisableClaimButton =
    unableToGetFees || excessiveNetworkFee || insufficientBalanceForFee

  useEffect(() => {
    if (showFeeError && !insufficientBalanceForFee) {
      navigate(AppNavigation.Earn.FeeUnavailable)
    }
  }, [navigate, showFeeError, insufficientBalanceForFee])

  const [claimableAmountInAvax, formattedClaimableAmountInCurrency] =
    useMemo(() => {
      if (data?.balancePerType.unlockedUnstaked) {
        const unlockedInUnit = new TokenUnit(
          data.balancePerType.unlockedUnstaked,
          pNetwork.networkToken.decimals,
          pNetwork.networkToken.symbol
        )
        return [
          unlockedInUnit.toDisplay(),
          appHook.tokenInCurrencyFormatter(
            Number(unlockedInUnit.mul(avaxPrice).toString())
          )
        ]
      }
      return [UNKNOWN_AMOUNT, UNKNOWN_AMOUNT]
    }, [
      avaxPrice,
      data?.balancePerType.unlockedUnstaked,
      pNetwork.networkToken.decimals,
      pNetwork.networkToken.symbol,
      appHook
    ])

  const [feesInAvax, formattedFeesInCurrency] = useMemo(() => {
    if (totalFees === undefined) {
      return [UNKNOWN_AMOUNT, UNKNOWN_AMOUNT]
    }

    return [
      totalFees.toDisplay(),
      appHook.tokenInCurrencyFormatter(
        Number(totalFees.mul(avaxPrice).toString())
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

  const handleFeesChange = useCallback(
    (fees: Eip1559Fees) => {
      setGasPrice(fees.maxFeePerGas)
    },
    [setGasPrice]
  )

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
      {xpProvider && xpProvider.isEtnaEnabled() && defaultTxFee && (
        <>
          <NetworkFeeSelector
            chainId={pNetwork.chainId}
            gasLimit={Number(defaultTxFee.toSubUnit())}
            onFeesChange={handleFeesChange}
            isGasLimitEditable={false}
            supportsAvalancheDynamicFee={
              xpProvider ? xpProvider.isEtnaEnabled() : false
            }
            showOnlyFeeSelection={true}
          />
          {excessiveNetworkFee && (
            <Text
              testID="excessive_fee_error_msg"
              variant="body2"
              sx={{ color: '$dangerMain' }}>
              {SendErrorMessage.EXCESSIVE_NETWORK_FEE}
            </Text>
          )}
        </>
      )}
      {insufficientBalanceForFee && (
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
