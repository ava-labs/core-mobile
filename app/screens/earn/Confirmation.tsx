import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { useNavigation, useRoute } from '@react-navigation/native'
import DotSVG from 'components/svg/DotSVG'
import Separator from 'components/Separator'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { Popable } from 'react-native-popable'
import { PopableLabel } from 'components/PopableLabel'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { PopableContent } from 'components/PopableContent'
import { truncateNodeId } from 'utils/Utils'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { addMinutes, format } from 'date-fns'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import { useSelector } from 'react-redux'
import {
  selectAvaxPrice,
  selectNativeTokenBalanceForNetworkAndAccount
} from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { selectActiveNetwork } from 'store/network'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import { NodeValidator } from 'types/earn'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { BigAvax, BigIntNavax } from 'types/denominations'
import Big from 'big.js'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
import { BN } from 'bn.js'
import { useMutation } from '@tanstack/react-query'

type NavigationProp = EarnScreenProps<typeof AppNavigation.Earn.Confirmation>

export const Confirmation = () => {
  const { nodeId, stakingAmount, stakingEndTime } =
    useRoute<NavigationProp['route']>().params
  const validator = useGetValidatorByNodeId(nodeId) as NodeValidator
  const {
    theme,
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const cChainBalance = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(
      activeNetwork.chainId,
      activeAccount?.index
    )
  )
  const cChainBalanceNAvax: BigIntNavax =
    bnToBigint(cChainBalance || new BN(0)) / BigInt(1e9) //TODO: make function for converting between denominations

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenSymbol = activeNetwork.networkToken.symbol
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigate } = useNavigation<NavigationProp['navigation']>()

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
    duration: (stakingEndTime.getTime() - new Date().getTime()) / 1e3,
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
    navigate(AppNavigation.Earn.Cancel)
  }

  const issueDelegationMutation = useMutation({
    mutationFn: () => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }

      return EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalance: cChainBalanceNAvax,
        isDevMode: isDeveloperMode,
        requiredAmount: stakingAmount
      }).then(successfullyCollected => {
        if (successfullyCollected) {
          return EarnService.issueAddDelegatorTransaction({
            activeAccount,
            endDate: trueStakingEndTime,
            isDevMode: isDeveloperMode,
            nodeId,
            stakeAmount: stakingAmount,
            startDate: minStartTime
          })
        } else {
          throw Error('Something went wrong')
        }
      })
    }
  })

  if (!validator) return null

  // TODO: on error, show error message as toast
  // on success, navigate to earn dashboard
  return (
    <ScrollView contentContainerStyle={{ minHeight: '100%' }}>
      <AvaText.LargeTitleBold
        textStyle={{ marginHorizontal: 16, marginBottom: 10 }}>
        Confirm Staking
      </AvaText.LargeTitleBold>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2
        }}>
        <View style={{ position: 'absolute' }}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <AvaLogoSVG
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
          size={57}
        />
      </View>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
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
                <PopableContent
                  message={'Fee paid to execute the transaction'}
                />
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
        <FlexSpacer />
        <AvaText.Caption
          textStyle={{
            color: theme.colorText2,
            textAlign: 'center',
            marginHorizontal: '15%',
            marginTop: 14,
            marginBottom: 24
          }}>
          By selecting "Stake Now" you will lock your funds for the set duration
          of time.
        </AvaText.Caption>
        <AvaButton.PrimaryLarge
          onPress={() => issueDelegationMutation.mutate()}
          disabled={issueDelegationMutation.isPending}>
          Stake Now
        </AvaButton.PrimaryLarge>
        <Space y={16} />
        <AvaButton.SecondaryLarge onPress={cancelStaking}>
          Cancel
        </AvaButton.SecondaryLarge>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})
