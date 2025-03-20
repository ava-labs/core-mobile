import React from 'react'
import { StyleSheet } from 'react-native'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { PChainTransaction, RewardType } from '@avalabs/glacier-sdk'
import {
  AddCard,
  CompletedCard,
  GRID_GAP,
  ProgressCard,
  SCREEN_WIDTH,
  useTheme
} from '@avalabs/k2-alpine'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { ListRenderItemInfo } from 'react-native'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { xpChainToken } from 'utils/units/knownTokens'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { UTCDate } from '@date-fns/utc'
import { fromUnixTime, secondsToMilliseconds } from 'date-fns'
import { SharedValue } from 'react-native-reanimated'
import { DeviceMotionMeasurement } from 'expo-sensors'

const StakesScreen = ({
  stakes,
  onPressStake,
  onAddStake,
  motion
}: {
  stakes: PChainTransaction[]
  onAddStake: () => void
  onPressStake: (tokenId: string) => void
  motion?: SharedValue<DeviceMotionMeasurement | undefined>
}): JSX.Element => {
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const completeCardBackground = theme.isDark
    ? require('../../../assets/images/complete-card-bg-dark.png')
    : require('../../../assets/images/complete-card-bg-light.png')

  const renderItem = ({
    item
  }: ListRenderItemInfo<
    typeof DUMMY_DATA_ADD | PChainTransaction
  >): JSX.Element | null => {
    if (item === DUMMY_DATA_ADD) {
      return <AddCard width={CARD_WIDTH} onPress={onAddStake} />
    }

    const now = new Date()

    if (isCompleted(item, now)) {
      const rewardUtxo = item.emittedUtxos.find(
        utxo =>
          utxo.rewardType === RewardType.DELEGATOR ||
          utxo.rewardType === RewardType.VALIDATOR
      )
      const rewardAmount = rewardUtxo?.asset.amount

      const rewardAmountInAvax = rewardAmount
        ? new TokenUnit(
            rewardAmount,
            xpChainToken.maxDecimals,
            xpChainToken.symbol
          )
        : undefined

      const rewardAmountInAvaxDisplay =
        rewardAmountInAvax?.toDisplay() ?? UNKNOWN_AMOUNT

      const title = `${rewardAmountInAvaxDisplay} AVAX reward claimed`

      return (
        <CompletedCard
          onPress={() => onPressStake(item.txHash)}
          title={title}
          action={undefined}
          width={CARD_WIDTH}
          backgroundImageSource={completeCardBackground}
        />
      )
    }

    if (isOnGoing(item, now)) {
      const estimatedRewardInAvax = item.estimatedReward
        ? new TokenUnit(
            item.estimatedReward,
            pChainNetworkToken.decimals,
            pChainNetworkToken.symbol
          )
        : undefined
      const estimatedRewardInAvaxDisplay =
        estimatedRewardInAvax?.toDisplay() ?? UNKNOWN_AMOUNT

      const remainingTime = getReadableDateDuration(
        new UTCDate(secondsToMilliseconds(item.endTimestamp || 0))
      )

      const title = `${estimatedRewardInAvaxDisplay} AVAX reward unlocked in\n${remainingTime}`

      const start = fromUnixTime(item.startTimestamp || 0).getTime()

      const endDate = fromUnixTime(item.endTimestamp || 0)
      const end = endDate.getTime()
      const progress = (now.getTime() - start) / (end - start)

      return (
        <ProgressCard
          title={title}
          progress={progress}
          width={CARD_WIDTH}
          motion={motion}
          onPress={() => onPressStake(item.txHash)}
        />
      )
    }

    return null
  }

  const data: (typeof DUMMY_DATA_ADD | PChainTransaction)[] = [
    DUMMY_DATA_ADD,
    ...stakes
  ]

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={styles.container}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      //   ListEmptyComponent={emptyComponent}
      showsVerticalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      removeClippedSubviews={true}
      columnWrapperStyle={{ gap: 14 }}
    />
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 }
})

const DUMMY_DATA_ADD = 'Add'
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default StakesScreen
