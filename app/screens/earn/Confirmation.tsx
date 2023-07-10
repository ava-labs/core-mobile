import React, { useMemo } from 'react'
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
import { format, fromUnixTime } from 'date-fns'
import { bnToLocaleString, bnToBig } from '@avalabs/utils-sdk'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import { useSelector } from 'react-redux'
import { selectAvaxPrice } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { getReadableDateDuration } from 'utils/getReadableDateDuration'
import { BN } from 'bn.js'
import { selectActiveNetwork } from 'store/network'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'

type NavigationProp = EarnScreenProps<typeof AppNavigation.Earn.Confirmation>

export const Confirmation = () => {
  const { nodeId, stakingAmount } = useRoute<NavigationProp['route']>().params
  const validator = useGetValidatorByNodeId(nodeId)
  const {
    theme,
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()
  const {
    networkToken: { symbol, decimals }
  } = useSelector(selectActiveNetwork)
  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigate } = useNavigation<NavigationProp['navigation']>()
  const validatorEndTime = fromUnixTime(Number(validator?.endTime))
  const { data } = useEarnCalcEstimatedRewards({
    amount: bnToBig(stakingAmount, decimals),
    duration: validatorEndTime.getTime() - new Date().getTime(),
    delegationFee: Number(validator?.delegationFee)
  })

  const { delegationFeeAvax, stakingAmountPrice, stakingAmountAvax } =
    useMemo(() => {
      const stakingAmountInAvax = Number(
        bnToLocaleString(stakingAmount.div(new BN(1e9)))
      )
      const delegationFee =
        (Number(validator?.delegationFee) / 100) * stakingAmountInAvax
      return {
        stakingAmountAvax: stakingAmountInAvax,
        stakingAmountPrice: stakingAmountInAvax * avaxPrice,
        delegationFeeAvax: delegationFee.toFixed(4)
      }
    }, [avaxPrice, stakingAmount, validator?.delegationFee])

  const { estimatedRewardAmount, estimatedRewardAvax } = useMemo(() => {
    return {
      estimatedRewardAvax: data?.estimatedTokenReward ?? 0,
      estimatedRewardAmount: data?.estimatedRewardAmount ?? 0 * avaxPrice
    }
  }, [avaxPrice, data?.estimatedRewardAmount, data?.estimatedTokenReward])

  const cancelStaking = () => {
    navigate(AppNavigation.Earn.Cancel)
  }

  // TODO: on error, show error message as toast
  // on success, navigate to earn dashboard
  return validator ? (
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
              {stakingAmountAvax + ' ' + symbol}
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
              {estimatedRewardAvax + ' ' + symbol}
            </AvaText.Heading2>
          </Row>
          <AvaText.Body3
            textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}>
            {`${tokenInCurrencyFormatter(
              estimatedRewardAmount
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
              {getReadableDateDuration(validatorEndTime)}
            </AvaText.Heading3>
            <AvaText.Body1>
              {format(validatorEndTime, 'MM/dd/yy  H:mm aa')}
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
            <AvaText.Heading6>Not implemented {symbol}</AvaText.Heading6>
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
              {delegationFeeAvax + ' ' + symbol}
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
        <AvaButton.PrimaryLarge>Stake Now</AvaButton.PrimaryLarge>
        <Space y={16} />
        <AvaButton.SecondaryLarge onPress={cancelStaking}>
          Cancel
        </AvaButton.SecondaryLarge>
      </View>
    </ScrollView>
  ) : null
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})
