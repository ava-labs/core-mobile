import React, { useMemo, useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import {
  AddCard,
  ClaimCard,
  CompletedCard,
  GRID_GAP,
  Motion,
  ProgressCard,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  useTheme
} from '@avalabs/k2-alpine'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { ListRenderItemInfo } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
import { UTCDate } from '@date-fns/utc'
import { secondsToMilliseconds } from 'date-fns'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import {
  formattedEstimatedRewardInAvax,
  formattedRewardAmountInAvax,
  getActiveStakeProgress
} from '../utils'

const StakesScreen = ({
  stakes,
  onAddStake,
  onClaim,
  onPressStake,
  motion
}: {
  stakes: PChainTransaction[]
  onAddStake: () => void
  onClaim: () => void
  onPressStake: (tokenId: string) => void
  motion?: Motion
}): JSX.Element => {
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const completeCardBackground = theme.isDark
    ? require('../../../assets/icons/complete-card-bg-dark.png')
    : require('../../../assets/icons/complete-card-bg-light.png')

  const claimableInAvax = useGetClaimableBalance()

  const data: StakeCardType[] = useMemo(() => {
    const result = [StaticCard.Add]
    if (claimableInAvax?.gt(0.05)) {
      result.push(StaticCard.Claim)
    }
    return [...result, ...stakes]
  }, [stakes, claimableInAvax])

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<StakeCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = <AddCard width={CARD_WIDTH} onPress={onAddStake} />
      } else if (item === StaticCard.Claim) {
        content = (
          <ClaimCard
            onPress={onClaim}
            title={`${claimableInAvax} AVAX reward unlocked`}
            width={CARD_WIDTH}
            backgroundImageSource={completeCardBackground}
          />
        )
      } else {
        const now = new Date()

        if (isCompleted(item, now)) {
          const rewardAmountInAvaxDisplay = formattedRewardAmountInAvax(item)

          content = (
            <CompletedCard
              onPress={() => onPressStake(item.txHash)}
              title={`${rewardAmountInAvaxDisplay} AVAX reward claimed`}
              width={CARD_WIDTH}
            />
          )
        } else if (isOnGoing(item, now)) {
          const remainingTime = getReadableDateDuration(
            new UTCDate(secondsToMilliseconds(item.endTimestamp || 0))
          )
          const estimatedRewardInAvaxDisplay = formattedEstimatedRewardInAvax(
            item,
            pChainNetworkToken
          )

          content = (
            <ProgressCard
              title={`${estimatedRewardInAvaxDisplay} AVAX reward unlocked in\n${remainingTime}`}
              progress={getActiveStakeProgress(item, now)}
              width={CARD_WIDTH}
              motion={motion}
              onPress={() => onPressStake(item.txHash)}
            />
          )
        }
      }

      if (content) {
        return (
          <Animated.View
            entering={getListItemEnteringAnimation(index)}
            layout={SPRING_LINEAR_TRANSITION}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [
      claimableInAvax,
      completeCardBackground,
      motion,
      onAddStake,
      onClaim,
      onPressStake,
      pChainNetworkToken
    ]
  )

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={styles.container}
      data={data}
      numColumns={2}
      renderItem={renderItem}
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

enum StaticCard {
  Add = 'Add',
  Claim = 'Claim'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default StakesScreen
