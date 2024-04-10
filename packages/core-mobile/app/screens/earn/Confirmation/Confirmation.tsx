import React, { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, Linking, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import {
  useIsFocused,
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
import { showSimpleToast, showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import Logger from 'utils/Logger'
import { DOCS_STAKING } from 'resources/Constants'
import { useEstimateStakingFees } from 'hooks/earn/useEstimateStakingFees'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useTimeElapsed } from 'hooks/time/useTimeElapsed'
import { timeToShowNetworkFeeError } from 'consts/earn'
import Spinner from 'components/animation/Spinner'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'
import {
  maybePromptEarnNotification,
  scheduleStakingCompleteNotifications
} from 'store/notifications'
import useStakingParams from 'hooks/earn/useStakingParams'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/useNetworks'
import { ConfirmScreen } from '../components/ConfirmScreen'
import UnableToEstimate from '../components/UnableToEstimate'
import { useValidateStakingEndTime } from './useValidateStakingEndTime'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>

export const Confirmation = (): JSX.Element | null => {
  const { selectActiveNetwork } = useNetworks()
  const dispatch = useDispatch()
  const { minStakeAmount } = useStakingParams()
  const avaxFormatter = useAvaxFormatter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isFocused = useIsFocused()
  const { navigate, getParent } = useNavigation<ScreenProps['navigation']>()
  const { nodeId, stakingAmount, stakingEndTime, onBack } =
    useRoute<ScreenProps['route']>().params
  const previousRoute = useNavigationState(
    state => state.routes[state.index - 1]
  )
  const isComingFromSelectNode =
    previousRoute && previousRoute.name === AppNavigation.StakeSetup.SelectNode
  const validator = useGetValidatorByNodeId(nodeId)
  const { theme } = useApplicationContext()
  const activeNetwork = selectActiveNetwork()
  const tokenSymbol = activeNetwork.networkToken.symbol
  const { issueDelegationMutation } = useIssueDelegation(
    onDelegationSuccess,
    onDelegationError,
    onFundsStuck
  )
  const claimableBalance = useGetClaimableBalance()
  const networkFees = useEstimateStakingFees(stakingAmount)

  let deductedStakingAmount = stakingAmount.sub(networkFees ?? 0)
  if (deductedStakingAmount.lt(minStakeAmount)) {
    deductedStakingAmount = stakingAmount
  }

  const { minStartTime, validatedStakingEndTime, validatedStakingDuration } =
    useValidateStakingEndTime(stakingEndTime, validator?.endTime ?? '')

  const { data } = useEarnCalcEstimatedRewards({
    amount: deductedStakingAmount,
    duration: validatedStakingDuration,
    delegationFee: Number(validator?.delegationFee)
  })

  const unableToGetNetworkFees = networkFees === undefined
  const showNetworkFeeError = useTimeElapsed(
    isFocused && unableToGetNetworkFees, // re-enable this checking whenever this screen is focused
    timeToShowNetworkFeeError
  )
  const activeAccount = useSelector(selectActiveAccount)

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

  useEffect(() => {
    if (showNetworkFeeError) {
      navigate(AppNavigation.Earn.FeeUnavailable)
    }
  }, [navigate, showNetworkFeeError])

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
      onTryAgain: () => issueDelegation()
    })
  }

  const issueDelegation = (): void => {
    if (!claimableBalance) {
      return
    }
    AnalyticsService.capture('StakeIssueDelegation')
    issueDelegationMutation.mutate({
      stakingAmount: deductedStakingAmount,
      startDate: minStartTime,
      endDate: validatedStakingEndTime,
      nodeId
    })
  }

  function onDelegationSuccess(txHash: string): void {
    AnalyticsService.capture('StakeDelegationSuccess')
    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Staking successful!'}
          type={TransactionToastType.SUCCESS}
        />
      ),
      duration: 'long'
    })
    getParent()?.goBack()
    dispatch(maybePromptEarnNotification)
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
  }

  function onDelegationError(error: Error): void {
    AnalyticsService.capture('StakeDelegationFail')
    showSimpleToast(error.message)
  }

  const handleReadMore = (): void => {
    Linking.openURL(DOCS_STAKING).catch(e => {
      Logger.error(DOCS_STAKING, e)
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
    const [stakingAmountInAvax, stakingAmountInCurrency] = avaxFormatter(
      deductedStakingAmount,
      true
    )

    return (
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center', marginTop: 3 }}>
          Staked Amount
        </AvaText.Body2>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading1>
            {stakingAmountInAvax + ' ' + tokenSymbol}
          </AvaText.Heading1>
          <AvaText.Heading3 textStyle={{ color: theme.colorText2 }}>
            {stakingAmountInCurrency}
          </AvaText.Heading3>
          <Space x={4} />
        </View>
      </Row>
    )
  }

  const renderEstimatedReward = (): JSX.Element => {
    if (data?.estimatedTokenReward) {
      const [estimatedRewardInAvax, estimatedRewardInCurrency] = avaxFormatter(
        data.estimatedTokenReward,
        true
      )

      return (
        <View
          style={{
            flexDirection: 'column'
          }}>
          <AvaText.Heading2 textStyle={{ color: theme.colorBgGreen }}>
            {estimatedRewardInAvax + ' ' + tokenSymbol}
          </AvaText.Heading2>
          <AvaText.Body3
            textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}>
            {estimatedRewardInCurrency}
          </AvaText.Body3>
        </View>
      )
    }

    return <UnableToEstimate />
  }

  const renderStakingFee = (): JSX.Element => {
    if (delegationFee) {
      const [delegationFeeInAvax] = avaxFormatter(delegationFee, true)
      return (
        <AvaText.Heading6>
          {delegationFeeInAvax + ' ' + tokenSymbol}
        </AvaText.Heading6>
      )
    }
    return <UnableToEstimate />
  }

  const renderNetworkFee = (): JSX.Element => {
    if (unableToGetNetworkFees) {
      return <Spinner size={22} />
    }

    const [networkFeesInAvax] = avaxFormatter(networkFees, true)

    return (
      <AvaText.Heading6 testID="network_fee">
        {networkFeesInAvax + ' ' + tokenSymbol}
      </AvaText.Heading6>
    )
  }

  if (!validator) return null

  return (
    <ConfirmScreen
      isConfirming={issueDelegationMutation.isPending}
      onConfirm={issueDelegation}
      onCancel={cancelStaking}
      header="Confirm Staking"
      confirmBtnTitle="Stake Now"
      cancelBtnTitle="Cancel"
      disclaimer="By selecting “Stake Now”, you will lock your AVAX for the staking duration you selected."
      confirmBtnDisabled={unableToGetNetworkFees}>
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
            {format(validatedStakingEndTime, 'MM/dd/yy  H:mm aa')}
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
              'Fee paid to the network to execute the transaction'
            )}
            position="right"
            style={{ width: 200 }}>
            Network Fee
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
