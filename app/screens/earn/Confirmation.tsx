import React, { useEffect, useMemo, useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
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
import { Popable } from 'react-native-popable'
import { PopableLabel } from 'components/PopableLabel'
import { PopableContent } from 'components/PopableContent'
import { truncateNodeId } from 'utils/Utils'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { addMinutes, format, fromUnixTime } from 'date-fns'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import { useSelector } from 'react-redux'
import { selectAvaxPrice } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { selectActiveNetwork } from 'store/network'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import { NodeValidator } from 'types/earn'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import { convertToSeconds, MilliSeconds } from 'types/siUnits'
import { useIssueDelegation } from 'hooks/earn/useIssueDelegation'
import { showSimpleToast, showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import Logger from 'utils/Logger'
import { DOCS_STAKING } from 'resources/Constants'
import { useEstimateStakingFee } from 'hooks/earn/useEstimateStakingFee'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { ConfirmScreen } from './components/ConfirmScreen'
import UnableToEstimate from './components/UnableToEstimate'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>

const onDelegationError = (error: Error) => {
  showSimpleToast(error.message)
}

export const Confirmation = () => {
  const { nodeId, stakingAmount, stakingEndTime } =
    useRoute<ScreenProps['route']>().params
  const previousRoute = useNavigationState(
    state => state.routes[state.index - 1]
  )
  const isComingFromSelectNode =
    previousRoute && previousRoute.name === AppNavigation.StakeSetup.SelectNode
  const validator = useGetValidatorByNodeId(nodeId) as NodeValidator
  const {
    theme,
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { issueDelegationMutation } = useIssueDelegation(
    onDelegationSuccess,
    onDelegationError
  )
  const claimableBalance = useGetClaimableBalance()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenSymbol = activeNetwork.networkToken.symbol
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigate, getParent } = useNavigation<ScreenProps['navigation']>()

  const stakingAmountPrice = stakingAmount.mul(avaxPrice).toFixed(2) //price is in [currency] so we round to 2 decimals
  const [now, setNow] = useState(new Date())
  const minStakeDurationMs = getMinimumStakeDurationMs(isDeveloperMode)
  //minStartTime - 1 minute after submitting
  const minStartTime = useMemo(() => {
    return addMinutes(now, 1)
  }, [now])
  const trueStakingEndTime = useMemo(() => {
    //check if stake duration is less than minimum, and adjust if necessary
    // this could happen if user selects minimal stake duration but is too long on confirmation screen
    if (
      stakingEndTime.getTime() - minStakeDurationMs <
      minStartTime.getTime()
    ) {
      return new Date(minStartTime.getTime() + minStakeDurationMs)
    }
    // check if stake duration is more than validator's end time,
    // use validator's end time if it is
    const validatorEndTime = fromUnixTime(Number(validator?.endTime))
    if (stakingEndTime > validatorEndTime) {
      return validatorEndTime
    }
    return stakingEndTime
  }, [minStakeDurationMs, minStartTime, stakingEndTime, validator?.endTime])

  const { data } = useEarnCalcEstimatedRewards({
    amount: stakingAmount,
    duration: convertToSeconds(
      BigInt(trueStakingEndTime.getTime() - now.getTime()) as MilliSeconds
    ),
    delegationFee: Number(validator?.delegationFee)
  })
  const estimatedRewardInCurrency: string =
    data?.estimatedRewardInCurrency ?? '0'

  const stakingFee = useEstimateStakingFee(stakingAmount)

  const delegationFee = useMemo(() => {
    if (
      data?.estimatedTokenReward === undefined &&
      validator?.delegationFee === undefined
    )
      return undefined
    return data?.estimatedTokenReward.mul(validator.delegationFee).div(100)
  }, [data?.estimatedTokenReward, validator?.delegationFee])

  // ticker - update "now" variable every 10s
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const cancelStaking = () => {
    navigate(AppNavigation.StakeSetup.Cancel)
  }

  const issueDelegation = () => {
    if (!claimableBalance) {
      return
    }
    issueDelegationMutation.mutate({
      stakingAmount,
      startDate: minStartTime,
      endDate: trueStakingEndTime,
      nodeId,
      claimableBalance
    })
  }

  function onDelegationSuccess(txHash: string) {
    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Staking successful!'}
          type={TransactionToastType.SUCCESS}
          txHash={txHash}
        />
      ),
      duration: 'long'
    })
    getParent()?.goBack()
  }

  const handleReadMore = () => {
    Linking.openURL(DOCS_STAKING).catch(e => {
      Logger.error(DOCS_STAKING, e)
    })
  }

  const renderPopoverInfoText = (message: string) => (
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

  const renderEstimatedRewardPopoverInfoText = () => (
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

  const renderEstimatedReward = () => {
    if (data?.estimatedTokenReward) {
      return (
        <View style={{ flexDirection: 'column' }}>
          <AvaText.Heading2 textStyle={{ color: theme.colorBgGreen }}>
            {data.estimatedTokenReward.toDisplay() + ' ' + tokenSymbol}
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

  const renderStakingFee = () => {
    if (delegationFee) {
      return (
        <AvaText.Heading6>
          {delegationFee.toDisplay() + ' ' + tokenSymbol}
        </AvaText.Heading6>
      )
    }
    return <UnableToEstimate />
  }

  if (!validator) return null

  // TODO: on error, show error message as toast
  // on success, navigate to earn dashboard
  return (
    <ConfirmScreen
      isConfirming={issueDelegationMutation.isPending}
      onConfirm={issueDelegation}
      onCancel={cancelStaking}
      header="Confirm Staking"
      confirmBtnTitle="Stake Now"
      cancelBtnTitle="Cancel"
      disclaimer="By selecting “Stake Now”, you will lock your AVAX for the staking duration you selected.">
      <Space y={4} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center', marginTop: 3 }}>
          Staked Amount
        </AvaText.Body2>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading1>
            {stakingAmount.toString() + ' ' + tokenSymbol}
          </AvaText.Heading1>
          <AvaText.Heading3 textStyle={{ color: theme.colorText2 }}>
            {`${tokenInCurrencyFormatter(
              stakingAmountPrice
            )} ${selectedCurrency}`}
          </AvaText.Heading3>
          <Space x={4} />
        </View>
      </Row>
      <Space y={16} />
      <Separator />
      <View style={styles.verticalPadding}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Popable
            content={renderEstimatedRewardPopoverInfoText()}
            position="top"
            style={{ minWidth: 150 }}
            backgroundColor={theme.neutral100}>
            <PopableLabel label="Estimated Reward" />
          </Popable>
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
        <Popable
          content={renderPopoverInfoText(
            'AVAX will be locked and unusable until this time'
          )}
          position="right"
          strictPosition={true}
          style={{ minWidth: 180 }}
          backgroundColor={theme.neutral100}>
          <PopableLabel label="Time to Unlock" />
        </Popable>
        <Row
          style={{
            justifyContent: 'space-between',
            marginTop: 4,
            width: '100%'
          }}>
          <AvaText.Heading3>
            {getReadableDateDuration(trueStakingEndTime)}
          </AvaText.Heading3>
          <AvaText.Body1>
            {format(trueStakingEndTime, 'MM/dd/yy  H:mm aa')}
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
          <Popable
            content={renderPopoverInfoText(
              'Fee paid to the network to execute the transaction'
            )}
            position="right"
            style={{ minWidth: 200 }}
            strictPosition={true}
            backgroundColor={theme.neutral100}>
            <PopableLabel label="Network Fee" />
          </Popable>
          <AvaText.Heading6>
            {stakingFee?.toDisplay() || 0} {tokenSymbol}
          </AvaText.Heading6>
        </Row>
      </View>
      <Separator />
      <View style={styles.verticalPadding}>
        <Row
          style={{
            justifyContent: 'space-between'
          }}>
          <Popable
            content={
              <PopableContent
                message={'Fee set and retained by the validator'}
              />
            }
            position="right"
            strictPosition={true}
            style={{ minWidth: 150 }}
            backgroundColor={theme.neutral100}>
            <PopableLabel label="Staking Fee" />
          </Popable>
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
