import React from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import StakeLogoSmallSVG from 'components/svg/StakeLogoSmallSVG'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import { Popable } from 'react-native-popable'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { format, fromUnixTime } from 'date-fns'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { useNAvaxToAvax } from 'hooks/useNAvaxToAvax'
import { StakeStatus } from 'types/earn'
import { getCardHighLightColor } from 'utils/color/getCardHighLightColor'
import { useNavigation } from '@react-navigation/native'
import { TabsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { StatusChip } from './StatusChip'

type BaseProps = {
  title: string
  txHash: string
  stakeAmount: string | undefined // in nAvax
  endTimestamp: number | undefined
}

type OnGoingProps = BaseProps & {
  estimatedReward: string | undefined // in nAvax
  status: StakeStatus.Ongoing
}

type CompletedProps = BaseProps & {
  rewardAmount: string | undefined // in nAvax
  status: StakeStatus.Completed
}

type Props = OnGoingProps | CompletedProps

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Earn
>['navigation']

export const StakeCard = (props: Props) => {
  const { theme } = useApplicationContext()
  const nAvaxToAvax = useNAvaxToAvax()
  const navigation = useNavigation<NavigationProp>()
  const { txHash, status, title, stakeAmount } = props

  const cardHighLightColor = getCardHighLightColor(theme)

  const navigateToStakeDetails = () => {
    navigation.navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.StakeDetails,
      params: { txHash, stakeTitle: title }
    })
  }

  const renderStatus = () => {
    switch (status) {
      case StakeStatus.Ongoing: {
        const remainingTime = getReadableDateDuration(
          fromUnixTime(props.endTimestamp || 0)
        )
        return (
          <AvaText.Caption color={theme.colorText1}>
            {remainingTime} remaining
          </AvaText.Caption>
        )
      }
      case StakeStatus.Completed:
        return <StatusChip status={StakeStatus.Completed} />
    }
  }

  const renderContents = () => {
    const [stakeAmountInAvax, stakeAmountInCurrency] = nAvaxToAvax(stakeAmount)

    switch (status) {
      case StakeStatus.Ongoing: {
        const [estimatedRewardInAvax, estimatedRewardInCurrency] = nAvaxToAvax(
          props.estimatedReward,
          true
        )

        return (
          <>
            <Row
              style={{
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}>
              <AvaText.Body2
                color={theme.colorText1}
                textStyle={{ lineHeight: 20 }}>
                Staked Amount
              </AvaText.Body2>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading6>{stakeAmountInAvax} AVAX</AvaText.Heading6>
                <AvaText.Overline>{stakeAmountInCurrency}</AvaText.Overline>
              </View>
            </Row>
            <Space y={8} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Popable
                content={
                  <PopableContent
                    message={
                      'Estimates are provided for informational purposes only, without any representation, warranty or guarantee, and do not represent any assurance that you will achieve the same results.'
                    }
                  />
                }
                position="top"
                strictPosition={true}
                style={{ minWidth: 240 }}
                backgroundColor={theme.colorBg3}>
                <PopableLabel
                  label="Estimated Rewards"
                  textStyle={{ lineHeight: 24, color: theme.colorText1 }}
                />
              </Popable>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading6 color={theme.colorBgGreen}>
                  {estimatedRewardInAvax} AVAX
                </AvaText.Heading6>
                <AvaText.Overline>{estimatedRewardInCurrency}</AvaText.Overline>
              </View>
            </Row>
          </>
        )
      }
      case StakeStatus.Completed: {
        const endDate = props.endTimestamp
          ? format(fromUnixTime(props.endTimestamp), 'MM/dd/yyyy')
          : 'N/A'
        const [rewardAmountInAvax, rewardAmountInCurrency] = nAvaxToAvax(
          props.rewardAmount,
          true
        )

        return (
          <>
            <Row
              style={{
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}>
              <AvaText.Body2
                color={theme.colorText1}
                textStyle={{ lineHeight: 20 }}>
                Amount Staked
              </AvaText.Body2>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading6>{stakeAmountInAvax} AVAX</AvaText.Heading6>
                <AvaText.Overline>{stakeAmountInCurrency}</AvaText.Overline>
              </View>
            </Row>
            <Space y={8} />
            <Row
              style={{
                justifyContent: 'space-between'
              }}>
              <AvaText.Body2
                color={theme.colorText1}
                textStyle={{ lineHeight: 20 }}>
                Earned Rewards
              </AvaText.Body2>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading6 color={theme.colorBgGreen}>
                  {rewardAmountInAvax} AVAX
                </AvaText.Heading6>
                <AvaText.Overline>{rewardAmountInCurrency}</AvaText.Overline>
              </View>
            </Row>
            <Space y={8} />
            <Row
              style={{
                justifyContent: 'space-between'
              }}>
              <AvaText.Body2
                color={theme.colorText1}
                textStyle={{ lineHeight: 20 }}>
                End Date
              </AvaText.Body2>
              <AvaText.Heading6>{endDate}</AvaText.Heading6>
            </Row>
          </>
        )
      }
    }
  }

  return (
    <TouchableHighlight
      style={[styles.container, { backgroundColor: theme.colorBg2 }]}
      activeOpacity={1}
      underlayColor={cardHighLightColor}
      onPress={navigateToStakeDetails}>
      <View>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            <StakeLogoSmallSVG />
            <Space x={16} />
            <AvaText.Heading6>{'Stake #' + title}</AvaText.Heading6>
          </Row>
          {renderStatus()}
        </Row>
        <Separator style={{ marginVertical: 16 }} />
        {renderContents()}
      </View>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8
  }
})
