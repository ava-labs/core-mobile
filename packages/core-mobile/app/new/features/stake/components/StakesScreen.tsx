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
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { ListRenderItemInfo } from '@shopify/flash-list'
import { getActiveStakeProgress, getStakeTitle } from '../utils'
import CompleteCardBackgroundImageDark from '../../../assets/icons/complete-card-bg-dark.png'
import CompleteCardBackgroundImageLight from '../../../assets/icons/complete-card-bg-light.png'

const StakesScreen = ({
  stakes,
  onAddStake,
  onClaim,
  onPressStake,
  onRefresh,
  isRefreshing,
  motion,
  canAddStake
}: {
  stakes: PChainTransaction[]
  onAddStake: () => void
  onClaim: () => void
  onPressStake: (txHash: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  motion?: Motion
  canAddStake: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const completeCardBackground = theme.isDark
    ? CompleteCardBackgroundImageDark
    : CompleteCardBackgroundImageLight

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
        content = (
          <AddCard
            width={CARD_WIDTH}
            onPress={onAddStake}
            disabled={!canAddStake}
          />
        )
      } else if (item === StaticCard.Claim) {
        content = (
          <ClaimCard
            onPress={onClaim}
            title={`${claimableInAvax?.toDisplay({
              fixedDp: 2
            })} AVAX reward unlocked`}
            width={CARD_WIDTH}
            backgroundImageSource={completeCardBackground}
          />
        )
      } else {
        const now = new Date()

        if (isCompleted(item, now)) {
          const title = getStakeTitle({
            stake: item,
            pChainNetworkToken,
            isActive: false
          })

          content = (
            <CompletedCard
              onPress={() => onPressStake(item.txHash)}
              title={title}
              width={CARD_WIDTH}
            />
          )
        } else if (isOnGoing(item, now)) {
          const title = getStakeTitle({
            stake: item,
            pChainNetworkToken,
            isActive: true
          })

          content = (
            <ProgressCard
              title={title}
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
            style={{
              marginBottom: 14,
              marginRight: index % 2 === 0 ? 6 : 0,
              marginLeft: index % 2 !== 0 ? 6 : 0
            }}
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
      canAddStake,
      onAddStake,
      onClaim,
      onPressStake,
      pChainNetworkToken
    ]
  )

  return (
    <CollapsibleTabs.FlashList
      contentContainerStyle={styles.container}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      removeClippedSubviews={true}
      extraData={theme.isDark} // force re-render when theme changes
      onRefresh={onRefresh}
      refreshing={isRefreshing}
    />
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 }
})

enum StaticCard {
  Add = 'Add',
  Claim = 'Claim'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default StakesScreen
