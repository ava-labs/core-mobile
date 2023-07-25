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
import { PopableLabel } from 'components/PopableLabel'
import { PopableContent } from 'components/PopableContent'
import { Popable } from 'react-native-popable'
import { ScrollView } from 'react-native-gesture-handler'
import { useStake } from 'hooks/earn/useStake'
import { useNAvaxToAvax } from 'hooks/conversion/useNAvaxToAvax'
import { format, fromUnixTime } from 'date-fns'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { humanize } from 'utils/string/humanize'
import { RewardType } from '@avalabs/glacier-sdk'
import { isOnGoing } from 'utils/earn/status'
import { estimatesTooltipText } from 'consts/earn'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { StatusChip } from './components/StatusChip'
import { StakeProgress } from './components/StakeProgress'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDetails>

const StakeDetails = () => {
  const { theme } = useApplicationContext()
  const { setOptions } = useNavigation<ScreenProps['navigation']>()
  const {
    params: { txHash, stakeTitle }
  } = useRoute<ScreenProps['route']>()
  const stake = useStake(txHash)
  const cChainBalance = useCChainBalance()
  const nAvaxToAvax = useNAvaxToAvax()
  const avaxPrice = cChainBalance.data?.price?.value

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

  const renderHeader = () => {
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

  const renderActiveDetails = () => {
    const formattedEndDate = format(endDate, 'LLLL d, yyyy, H:mm aa')
    const remainingTime = humanize(getReadableDateDuration(endDate))
    const [estimatedRewardInAvax, estimatedRewardInCurrency] = nAvaxToAvax(
      stake.estimatedReward,
      avaxPrice,
      true
    )

    return (
      <>
        <Row style={styles.row}>
          <Popable
            content={<PopableContent message={estimatesTooltipText} />}
            position="right"
            strictPosition={true}
            style={{ minWidth: 200 }}
            backgroundColor={theme.colorBg3}>
            <PopableLabel
              label="Estimated Rewards"
              textStyle={{ lineHeight: 24, color: theme.colorText1 }}
            />
          </Popable>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Heading4 color={theme.colorBgGreen}>
              {estimatedRewardInAvax} AVAX
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

  const renderCompletedDetails = () => {
    const endDateStr = format(endDate, 'MM/dd/yyyy')
    const rewardUtxo = stake.emittedUtxos.find(
      utxo => utxo.rewardType === RewardType.DELEGATOR
    )
    const rewardUtxoTxHash = rewardUtxo?.txHash
    const rewardAmount = rewardUtxo?.amount
    const [rewardAmountInAvax, rewardAmountInCurrency] = nAvaxToAvax(
      rewardAmount,
      avaxPrice,
      true
    )

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
              {rewardAmountInAvax} AVAX
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
  const renderBody = () => {
    const stakeAmount = stake.amountStaked?.[0]?.amount
    const [stakeAmountInAvax, stakeAmountInCurrency] = nAvaxToAvax(
      stakeAmount,
      avaxPrice
    )

    return (
      <View>
        <Row style={styles.row}>
          <AvaText.Body2
            color={theme.colorText1}
            textStyle={{ lineHeight: 20 }}>
            Staked Amount
          </AvaText.Body2>
          <View style={styles.value}>
            <AvaText.Heading4>{stakeAmountInAvax} AVAX</AvaText.Heading4>
            <Space y={4} />
            <AvaText.Body2>{stakeAmountInCurrency}</AvaText.Body2>
          </View>
        </Row>
        <Separator style={styles.line} />
        {isActive ? renderActiveDetails() : renderCompletedDetails()}
      </View>
    )
  }

  const renderProgress = () => {
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
