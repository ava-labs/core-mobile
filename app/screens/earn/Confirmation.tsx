import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { useNavigation, useRoute } from '@react-navigation/native'
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
import { addMinutes, format } from 'date-fns'
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
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { BigAvax } from 'types/denominations'
import Big from 'big.js'
import { convertToSeconds, MilliSeconds } from 'types/siUnits'
import { useIssueDelegation } from 'hooks/earn/useIssueDelegation'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { ConfirmScreen } from './components/ConfirmScreen'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>

export const Confirmation = () => {
  const { nodeId, stakingAmount, stakingEndTime } =
    useRoute<ScreenProps['route']>().params
  const validator = useGetValidatorByNodeId(nodeId) as NodeValidator
  const {
    theme,
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { issueDelegationMutation } = useIssueDelegation(onDelegationSuccess)

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenSymbol = activeNetwork.networkToken.symbol
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigate, getParent } = useNavigation<ScreenProps['navigation']>()

  const stakingAmountInAvax: BigAvax = bigintToBig(stakingAmount, 9)
  const stakingAmountPrice = stakingAmountInAvax.mul(avaxPrice).toFixed(2) //price is in [currency] so we round to 2 decimals
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

    return stakingEndTime
  }, [minStakeDurationMs, minStartTime, stakingEndTime])

  const { data } = useEarnCalcEstimatedRewards({
    amount: stakingAmount,
    duration: convertToSeconds(
      BigInt(trueStakingEndTime.getTime() - now.getTime()) as MilliSeconds
    ),
    delegationFee: Number(validator?.delegationFee)
  })
  const estimatedTokenReward: BigAvax = data?.estimatedTokenReward ?? Big(0)
  const estimatedRewardInCurrency: string =
    data?.estimatedRewardInCurrency ?? '0'

  const delegationFee: BigAvax = useMemo(() => {
    return estimatedTokenReward.mul(Number(validator?.delegationFee)).div(100)
  }, [estimatedTokenReward, validator?.delegationFee])

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
    issueDelegationMutation.mutate({
      stakingAmount: stakingAmount,
      startDate: minStartTime,
      endDate: trueStakingEndTime,
      nodeId
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
      disclaimer='By selecting "Stake Now" you will lock your funds for the set
    duration of time.'>
      <Space y={4} />
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2 textStyle={{ textAlign: 'center', marginTop: 3 }}>
          Staked Amount
        </AvaText.Body2>
        <View style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading1>
            {stakingAmountInAvax + ' ' + tokenSymbol}
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
          <AvaText.Body2>Estimated Reward</AvaText.Body2>
          <AvaText.Heading2 textStyle={{ color: theme.colorBgGreen }}>
            {estimatedTokenReward + ' ' + tokenSymbol}
          </AvaText.Heading2>
        </Row>
        <AvaText.Body3
          textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}>
          {`${tokenInCurrencyFormatter(
            estimatedRewardInCurrency
          )} ${selectedCurrency}`}
        </AvaText.Body3>
      </View>
      <Separator />
      <View
        style={{
          paddingVertical: 16,
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
        <Popable
          content={
            <PopableContent
              message={'AVAX will be locked and unclaimable until this time'}
            />
          }
          position="right"
          strictPosition={true}
          style={{ minWidth: 180 }}
          backgroundColor={theme.colorBg3}>
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
      <Separator />

      <View style={styles.verticalPadding}>
        <Row
          style={{
            justifyContent: 'space-between'
          }}>
          <Popable
            content={
              <PopableContent message={'Fee paid to execute the transaction'} />
            }
            position="right"
            style={{ minWidth: 150 }}
            strictPosition={true}
            backgroundColor={theme.colorBg3}>
            <PopableLabel label="Network Fee" />
          </Popable>
          <AvaText.Heading6>Not implemented {tokenSymbol}</AvaText.Heading6>
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
                message={'Transaction fee paid to the validator'}
              />
            }
            position="right"
            strictPosition={true}
            style={{ minWidth: 150 }}
            backgroundColor={theme.colorBg3}>
            <PopableLabel label="Staking Fee" />
          </Popable>
          <AvaText.Heading6>
            {delegationFee + ' ' + tokenSymbol}
          </AvaText.Heading6>
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
