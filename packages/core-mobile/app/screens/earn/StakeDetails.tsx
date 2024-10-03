import React, { useLayoutEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { round } from 'lodash'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StakeStatus } from 'types/earn'
import StakeLogoBigSVG from 'components/svg/StakeLogoBigSVG'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import TokenAddress from 'components/TokenAddress'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import { ScrollView } from 'react-native-gesture-handler'
import { useStake } from 'hooks/earn/useStake'
import { format, fromUnixTime } from 'date-fns'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { humanize } from 'utils/string/humanize'
import { RewardType } from '@avalabs/glacier-sdk'
import { isOnGoing } from 'utils/earn/status'
import { estimatesTooltipText } from 'consts/earn'
import { Tooltip } from 'components/Tooltip'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import { getXPChainTokenUnit } from 'utils/units/knownTokens'
import { StatusChip } from './components/StatusChip'
import { StakeProgress } from './components/StakeProgress'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDetails>

const StakeDetails = (): JSX.Element | null => {
  const { theme } = useApplicationContext()
  const { setOptions } = useNavigation<ScreenProps['navigation']>()
  const {
    params: { txHash, stakeTitle }
  } = useRoute<ScreenProps['route']>()
  const stake = useStake(txHash)
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()

  const isActive = useMemo(() => {
    if (!stake) return false

    const now = new Date()
    return isOnGoing(stake, now)
  }, [stake])

  useLayoutEffect(() => {
    const status = isActive ? StakeStatus.Ongoing : StakeStatus.Completed

    setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <View style={styles.statusChip}>
          <StatusChip status={status} />
        </View>
      )
    })
  }, [isActive, setOptions])

  if (!stake) return null

  const endDate = fromUnixTime(stake.endTimestamp || 0)

  const renderHeader = (): JSX.Element => {
    return (
      <View style={styles.header}>
        <StakeLogoBigSVG />
        <Space y={16} />
        <AvaText.Heading4>Stake #{stakeTitle}</AvaText.Heading4>
        <Space y={2} />
        <TokenAddress
          address={stake.nodeId ?? ''}
          textColor={theme.colorText2}
          textType="Body2"
          copyIconEnd
        />
      </View>
    )
  }

  const renderActiveDetails = (): JSX.Element => {
    const formattedEndDate = format(endDate, 'LLLL d, yyyy, H:mm aa')
    const remainingTime = humanize(getReadableDateDuration(endDate))
    const estimatedRewardInAvax = stake.estimatedReward
      ? new TokenUnit(
          stake.estimatedReward,
          getXPChainTokenUnit().getMaxDecimals(),
          getXPChainTokenUnit().getSymbol()
        )
      : undefined
    const estimatedRewardInCurrency =
      estimatedRewardInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

    return (
      <>
        <Row style={styles.row}>
          <Tooltip
            content={estimatesTooltipText}
            position="right"
            style={{ width: 200 }}
            textStyle={{ lineHeight: 24, color: theme.colorText1 }}>
            Estimated Rewards
          </Tooltip>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Heading4 color={theme.colorBgGreen}>
              {estimatedRewardInAvax?.toDisplay() ?? '-'} AVAX
            </AvaText.Heading4>
            <Space y={2} />
            <AvaText.Body2>{estimatedRewardInCurrency}</AvaText.Body2>
          </View>
        </Row>
        <Separator style={styles.line} />
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            Time Remaining
          </AvaText.Body2>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Heading6>{remainingTime}</AvaText.Heading6>
            <Space y={2} />
            <AvaText.Body2>{formattedEndDate}</AvaText.Body2>
          </View>
        </Row>
      </>
    )
  }

  const renderCompletedDetails = (): JSX.Element => {
    const endDateStr = format(endDate, 'MM/dd/yyyy')
    const rewardUtxo = stake.emittedUtxos.find(
      utxo =>
        utxo.rewardType === RewardType.DELEGATOR ||
        utxo.rewardType === RewardType.VALIDATOR
    )
    const rewardUtxoTxHash = rewardUtxo?.txHash
    const rewardAmountInAvax = rewardUtxo?.asset.amount
      ? new TokenUnit(
          rewardUtxo.asset.amount,
          getXPChainTokenUnit().getMaxDecimals(),
          getXPChainTokenUnit().getSymbol()
        )
      : undefined
    const rewardAmountInCurrency =
      rewardAmountInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

    return (
      <>
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            Earned Rewards
          </AvaText.Body2>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Heading4 color={theme.colorBgGreen}>
              {rewardAmountInAvax?.toDisplay() ?? '-'} AVAX
            </AvaText.Heading4>
            <Space y={2} />
            <AvaText.Body2>{rewardAmountInCurrency}</AvaText.Body2>
          </View>
        </Row>
        <Separator style={styles.line} />
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            Transaction ID
          </AvaText.Body2>
          <TokenAddress
            address={rewardUtxoTxHash ?? ''}
            textColor={theme.colorText1}
            textType="Body1"
            copyIconEnd
          />
        </Row>
        <Separator style={styles.line} />
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            End Date
          </AvaText.Body2>
          <AvaText.Body1>{endDateStr}</AvaText.Body1>
        </Row>
      </>
    )
  }
  const renderBody = (): JSX.Element => {
    const stakeAmount = stake.amountStaked?.[0]?.amount
    const stakeAmountInAvax = stakeAmount
      ? new TokenUnit(
          stakeAmount,
          getXPChainTokenUnit().getMaxDecimals(),
          getXPChainTokenUnit().getSymbol()
        )
      : undefined
    const stakeAmountInCurrency =
      stakeAmountInAvax?.mul(avaxPrice).toDisplay({ fixedDp: 2 }) ?? '-'

    return (
      <View>
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            Staked Amount
          </AvaText.Body2>
          <View style={styles.value}>
            <AvaText.Heading4>
              {stakeAmountInAvax?.toDisplay() ?? '-'} AVAX
            </AvaText.Heading4>
            <Space y={4} />
            <AvaText.Body2>{stakeAmountInCurrency}</AvaText.Body2>
          </View>
        </Row>
        <Separator style={styles.line} />
        {isActive ? renderActiveDetails() : renderCompletedDetails()}
      </View>
    )
  }

  const renderProgress = (): JSX.Element => {
    if (!isActive) return <StakeProgress progress={100} />

    const start = fromUnixTime(stake.startTimestamp || 0).getTime()
    const end = endDate.getTime()
    const now = new Date().getTime()
    const progress = ((now - start) / (end - start)) * 100

    return <StakeProgress progress={round(progress, 0)} />
  }

  return (
    <ScrollView style={styles.container}>
      {renderHeader()}
      <Space y={40} />
      {renderBody()}
      <Space y={22} />
      {renderProgress()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  header: {
    alignItems: 'center'
  },
  row: {
    justifyContent: 'space-between'
  },
  value: {
    alignItems: 'flex-end'
  },
  line: {
    marginVertical: 16
  },
  statusChip: { marginRight: 16 }
})

export default StakeDetails
