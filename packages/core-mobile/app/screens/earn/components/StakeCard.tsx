import React from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import StakeLogoSmallSVG from 'components/svg/StakeLogoSmallSVG'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { Space } from 'components/Space'
import { format, fromUnixTime } from 'date-fns'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { StakeStatus } from 'types/earn'
import { getCardHighLightColor } from 'utils/color/getCardHighLightColor'
import { useNavigation } from '@react-navigation/native'
import { TabsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { estimatesTooltipText } from 'consts/earn'
import { Tooltip } from 'components/Tooltip'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { getXPChainTokenUnit } from 'utils/units/knownTokens'
import { UTCDate } from '@date-fns/utc'
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
  typeof AppNavigation.Tabs.Stake
>['navigation']

export const StakeCard = (props: Props): JSX.Element => {
  const { theme } = useApplicationContext()
  const navigation = useNavigation<NavigationProp>()
  const { txHash, status, title, stakeAmount } = props
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const cardHighLightColor = getCardHighLightColor(theme)

  const navigateToStakeDetails = (): void => {
    navigation.navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.StakeDetails,
      params: { txHash, stakeTitle: title }
    })
  }

  const renderStatus = (): JSX.Element => {
    switch (status) {
      case StakeStatus.Ongoing: {
        const remainingTime = getReadableDateDuration(
          new UTCDate(props.endTimestamp || 0)
        )
        return (
          <AvaText.Caption testID="time_remaining" color={theme.colorText1}>
            {remainingTime} remaining
          </AvaText.Caption>
        )
      }
      case StakeStatus.Completed:
        return (
          <StatusChip
            testID="Completed_status_chip"
            status={StakeStatus.Completed}
          />
        )
    }
  }

  const renderContents = (): JSX.Element => {
    const stakeAmountInAvax = stakeAmount
      ? new TokenUnit(
          stakeAmount,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
    const stakeAmountInCurrency =
      stakeAmountInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

    switch (status) {
      case StakeStatus.Ongoing: {
        const estimatedRewardInAvax = props.estimatedReward
          ? new TokenUnit(
              props.estimatedReward,
              pChainNetworkToken.decimals,
              pChainNetworkToken.symbol
            )
          : undefined
        const estimatedRewardInCurrency =
          estimatedRewardInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

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
                <AvaText.Heading6 testID="staked_amount">
                  {stakeAmountInAvax?.toDisplay() ?? '-'} AVAX
                </AvaText.Heading6>
                <AvaText.Overline>{stakeAmountInCurrency}</AvaText.Overline>
              </View>
            </Row>
            <Space y={8} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Tooltip
                content={estimatesTooltipText}
                style={{ width: 240 }}
                textStyle={{ lineHeight: 20 }}>
                Estimated Rewards
              </Tooltip>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading6
                  testID="estimated_rewards"
                  color={theme.colorBgGreen}>
                  {estimatedRewardInAvax?.toDisplay() ?? '-'} AVAX
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
        const rewardAmountInAvax = props.rewardAmount
          ? new TokenUnit(
              props.rewardAmount,
              getXPChainTokenUnit().getMaxDecimals(),
              getXPChainTokenUnit().getSymbol()
            )
          : undefined
        const rewardAmountInCurrency =
          rewardAmountInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

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
                <AvaText.Heading6 testID="staked_amount">
                  {stakeAmountInAvax?.toDisplay() ?? '-'} AVAX
                </AvaText.Heading6>
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
                <AvaText.Heading6
                  testID="earned_rewards"
                  color={theme.colorBgGreen}>
                  {rewardAmountInAvax?.toDisplay() ?? '-'} AVAX
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
              <AvaText.Heading6 testID="end_date">{endDate}</AvaText.Heading6>
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
            <AvaText.Heading6 testID="stake_card_title">
              {'Stake #' + title}
            </AvaText.Heading6>
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
    borderRadius: 8,
    marginVertical: 8
  }
})
