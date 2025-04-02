import React, { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, Linking, StyleSheet } from 'react-native'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import {
  useNavigation,
  useNavigationState,
  useRoute
} from '@react-navigation/native'
import Separator from 'components/Separator'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import { truncateNodeId } from 'utils/Utils'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { format, getUnixTime } from 'date-fns'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import { useDispatch, useSelector } from 'react-redux'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import { useIssueDelegation } from 'hooks/earn/useIssueDelegation'
import { showTransactionErrorToast } from 'utils/toast'
import Logger from 'utils/Logger'
import { DOCS_STAKING_URL } from 'resources/Constants'
import { scheduleStakingCompleteNotifications } from 'store/notifications'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showTransactionSuccessToast } from 'utils/toast'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { View } from '@avalabs/k2-mobile'
import NetworkService from 'services/network/NetworkService'
import { useDelegationContext } from 'contexts/DelegationContext'
import { ConfirmScreen } from '../components/ConfirmScreen'
import UnableToEstimate from '../components/UnableToEstimate'
import { useValidateStakingEndTime } from './useValidateStakingEndTime'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>

export const Confirmation = (): JSX.Element | null => {
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigate, getParent } = useNavigation<ScreenProps['navigation']>()
  const { nodeId, stakingEndTime, onBack } =
    useRoute<ScreenProps['route']>().params
  const previousRoute = useNavigationState(
    state => state.routes[state.index - 1]
  )
  const isComingFromSelectNode =
    previousRoute && previousRoute.name === AppNavigation.StakeSetup.SelectNode
  const validator = useGetValidatorByNodeId(nodeId)
  const { theme } = useApplicationContext()
  const pNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const cChainNetwork = useCChainNetwork()
  const avaxSymbol = cChainNetwork?.networkToken?.symbol

  const validatorEndTimeUnix = useMemo(() => {
    if (validator?.endTime) {
      return Number(validator?.endTime)
    }
    return 0
  }, [validator?.endTime])

  const { minStartTime, validatedStakingEndTime, validatedStakingDuration } =
    useValidateStakingEndTime(stakingEndTime, validatorEndTimeUnix)

  const onDelegationSuccess = useCallback(
    (txHash: string): void => {
      AnalyticsService.capture('StakeDelegationSuccess')
      showTransactionSuccessToast({ message: 'Staking successful!' })

      getParent()?.goBack()
      dispatch(
        scheduleStakingCompleteNotifications([
          {
            txHash,
            endTimestamp: getUnixTime(validatedStakingEndTime),
            accountIndex: activeAccount?.index,
            isDeveloperMode
          }
        ])
      )
    },
    [
      activeAccount?.index,
      dispatch,
      getParent,
      isDeveloperMode,
      validatedStakingEndTime
    ]
  )

  const onDelegationError = useCallback((error: Error): void => {
    AnalyticsService.capture('StakeDelegationFail')
    showTransactionErrorToast({ message: error.message })
  }, [])

  const { issueDelegationMutation } = useIssueDelegation(
    onDelegationSuccess,
    onDelegationError,
    onFundsStuck
  )
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()

  const localValidatedStakingEndTime = useMemo(() => {
    return new Date(validatedStakingEndTime.getTime())
  }, [validatedStakingEndTime])

  const { networkFees, stakeAmount } = useDelegationContext()

  const { data } = useEarnCalcEstimatedRewards({
    amountNanoAvax: stakeAmount.toSubUnit(),
    duration: validatedStakingDuration,
    delegationFee: Number(validator?.delegationFee)
  })

  const networkFeesInAvax = useMemo(
    () =>
      new TokenUnit(
        networkFees,
        pNetwork.networkToken.decimals,
        pNetwork.networkToken.symbol
      ).toDisplay({ fixedDp: 6 }),
    [networkFees, pNetwork.networkToken.decimals, pNetwork.networkToken.symbol]
  )

  const handleOnBack = useCallback(() => {
    onBack?.()
    return true
  }, [onBack])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleOnBack
    )
    return () => backHandler.remove()
  }, [onBack, handleOnBack])

  const delegationFee = useMemo(() => {
    if (
      data?.estimatedTokenReward === undefined ||
      validator?.delegationFee === undefined
    )
      return undefined

    return data.estimatedTokenReward.mul(validator.delegationFee).div(100)
  }, [data?.estimatedTokenReward, validator?.delegationFee])

  const cancelStaking = (): void => {
    AnalyticsService.capture('StakeCancelStaking', {
      from: 'ConfirmationScreen'
    })
    navigate(AppNavigation.StakeSetup.Cancel)
  }

  function onFundsStuck(): void {
    navigate(AppNavigation.StakeSetup.FundsStuck, {
      onTryAgain: () => {
        // trying again with updated steps
        issueDelegation(true)
      }
    })
  }

  const handleReadMore = (): void => {
    Linking.openURL(DOCS_STAKING_URL).catch(e => {
      Logger.error(DOCS_STAKING_URL, e)
    })
  }

  const issueDelegation = (recomputeSteps = false): void => {
    AnalyticsService.capture('StakeIssueDelegation')

    issueDelegationMutation.mutate({
      startDate: minStartTime,
      endDate: validatedStakingEndTime,
      nodeId,
      recomputeSteps
    })
  }

  const renderPopoverInfoText = (message: string): JSX.Element => (
    <View
      style={{
        marginHorizontal: 8,
        marginVertical: 4,
        backgroundColor: theme.neutral100
      }}>
      <AvaText.Caption textStyle={{ color: theme.neutral900 }}>
        {message}
      </AvaText.Caption>
    </View>
  )

  const renderEstimatedRewardPopoverInfoText = (): JSX.Element => (
    <View
      style={{
        marginHorizontal: 8,
        marginVertical: 4,
        backgroundColor: theme.neutral100
      }}>
      <AvaText.Caption textStyle={{ color: theme.neutral900 }}>
        Estimates are provided for informational purposes only, without any
        representation, warranty or guarantee, and do not represent any
        assurance that you will achieve the same results.
      </AvaText.Caption>
      <Space y={16} />
      <AvaText.Caption
        textStyle={{ color: theme.blueDark, fontWeight: '600' }}
        onPress={handleReadMore}>
        Read More
      </AvaText.Caption>
    </View>
  )

  const renderStakedAmount = (): JSX.Element => {
    const stakingAmountInAvax = stakeAmount.toDisplay()
    const stakingAmountInCurrency = stakeAmount
      .mul(avaxPrice)
      .toDisplay({ fixedDp: 2, asNumber: true })

    return (
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center', marginTop: 3 }}>
          Staked Amount
        </AvaText.Body2>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading1>
            {stakingAmountInAvax + ' ' + avaxSymbol}
          </AvaText.Heading1>
          <AvaText.Heading3 textStyle={{ color: theme.colorText2 }}>
            {`${tokenInCurrencyFormatter(
              stakingAmountInCurrency
            )} ${selectedCurrency}`}
          </AvaText.Heading3>
          <Space x={4} />
        </View>
      </Row>
    )
  }

  const renderEstimatedReward = (): JSX.Element => {
    if (data?.estimatedTokenReward) {
      const estimatedRewardInAvax = data.estimatedTokenReward.toDisplay()
      const estimatedRewardInCurrency = data.estimatedTokenReward
        .mul(avaxPrice)
        .toDisplay({ fixedDp: 2, asNumber: true })

      return (
        <View
          style={{
            flexDirection: 'column'
          }}>
          <AvaText.Heading2 textStyle={{ color: theme.colorBgGreen }}>
            {estimatedRewardInAvax + ' ' + avaxSymbol}
          </AvaText.Heading2>
          <AvaText.Body3
            textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}>
            {`${tokenInCurrencyFormatter(
              estimatedRewardInCurrency
            )} ${selectedCurrency}`}
          </AvaText.Body3>
        </View>
      )
    }

    return <UnableToEstimate />
  }

  const renderStakingFee = (): JSX.Element => {
    if (delegationFee) {
      return (
        <AvaText.Heading6>
          {delegationFee.toDisplay() + ' ' + avaxSymbol}
        </AvaText.Heading6>
      )
    }
    return <UnableToEstimate />
  }

  const renderNetworkFee = (): JSX.Element => {
    return (
      <AvaText.Heading6 testID="network_fee">
        {networkFeesInAvax + ' ' + avaxSymbol}
      </AvaText.Heading6>
    )
  }

  if (!validator) return null

  return (
    <ConfirmScreen
      isConfirming={issueDelegationMutation.isPending}
      onConfirm={() => {
        issueDelegation()
      }}
      onCancel={cancelStaking}
      header="Confirm Staking"
      confirmBtnTitle="Stake Now"
      cancelBtnTitle="Cancel"
      disclaimer="By selecting “Stake Now”, you will lock your AVAX for the staking duration you selected.">
      <Space y={4} />
      {renderStakedAmount()}
      <Space y={16} />
      <Separator />
      <View style={styles.verticalPadding}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Tooltip
            content={renderEstimatedRewardPopoverInfoText()}
            position="right"
            style={{ width: 180 }}>
            Estimated Reward
          </Tooltip>
          {renderEstimatedReward()}
        </Row>
      </View>
      <Separator />
      <View
        style={{
          paddingVertical: 16,
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
        <Tooltip
          content={renderPopoverInfoText(
            'AVAX will be locked and unusable until this time'
          )}
          position="right"
          style={{ width: 180 }}>
          Time to Unlock
        </Tooltip>
        <Row
          style={{
            justifyContent: 'space-between',
            marginTop: 4,
            width: '100%'
          }}>
          <AvaText.Heading3>
            {getReadableDateDuration(validatedStakingEndTime)}
          </AvaText.Heading3>
          <AvaText.Body1>
            {format(localValidatedStakingEndTime, 'MM/dd/yy  H:mm aa')}
          </AvaText.Body1>
        </Row>
      </View>
      <Separator />

      {isComingFromSelectNode && (
        <View style={styles.verticalPadding}>
          <Row
            style={{
              justifyContent: 'space-between'
            }}>
            <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
              Node ID
            </AvaText.Body2>

            <AvaText.Heading6 textStyle={{ alignSelf: 'flex-end' }}>
              <AvaButton.TextWithIcon
                textStyle={{ alignItems: 'flex-end' }}
                style={{ alignSelf: 'flex-end' }}
                onPress={() => copyToClipboard(validator.nodeID)}
                icon={<CopySVG />}
                iconPlacement="right"
                text={
                  <AvaText.Body1
                    color={theme.colorText1}
                    textStyle={{ alignSelf: 'flex-end' }}>
                    {truncateNodeId(validator.nodeID ?? '', 4)}
                  </AvaText.Body1>
                }
              />
            </AvaText.Heading6>
          </Row>
        </View>
      )}
      <Separator />

      <View style={styles.verticalPadding}>
        <Row
          style={{
            justifyContent: 'space-between'
          }}>
          <Tooltip
            content={renderPopoverInfoText(
              'Estimated fee paid to the network to execute the transaction'
            )}
            position="right"
            style={{ width: 200 }}>
            Estimated Network Fee
          </Tooltip>
          {renderNetworkFee()}
        </Row>
      </View>
      <Separator />
      <View style={styles.verticalPadding}>
        <Row
          style={{
            justifyContent: 'space-between'
          }}>
          <Tooltip
            content="Fee set and retained by the validator"
            position="right"
            style={{ width: 150 }}>
            Staking Fee
          </Tooltip>
          {renderStakingFee()}
        </Row>
      </View>
    </ConfirmScreen>
  )
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})
