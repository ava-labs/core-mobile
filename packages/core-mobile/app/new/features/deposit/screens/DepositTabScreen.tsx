import { PChainTransaction } from '@avalabs/glacier-sdk'
import {
  AddCard,
  CompletedCard,
  GRID_GAP,
  ProgressCard,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { useDeposits } from 'hooks/earn/useDeposits'
import { useRouter } from 'expo-router'
import { getActiveStakeProgress, getStakeTitle } from '../../stake/utils'

const DepositTabScreen = ({
  onScroll,
  onHeaderLayout,
  animatedHeaderStyle,
  containerStyle,
  isActive
}: {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  onHeaderLayout: (event: LayoutChangeEvent) => void
  animatedHeaderStyle: { opacity: number }
  containerStyle?: StyleProp<ViewStyle>
  isActive: boolean
}): JSX.Element => {
  const { navigate } = useRouter()
  const { data: _data, isRefreshing, pullToRefresh: onRefresh } = useDeposits()
  const stakes = useMemo(() => _data ?? [], [_data])
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const data: StakeCardType[] = useMemo(() => {
    return [StaticCard.Add, ...stakes]
  }, [stakes])

  const handleAddDeposit = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/deposit' })
  }, [navigate])

  const handlePressDeposit = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/depositDetail', params: { txHash } })
  }, [navigate])

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<StakeCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = <AddCard width={CARD_WIDTH} onPress={handleAddDeposit} />
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
              onPress={() => handlePressDeposit()}
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
              motion={undefined}
              onPress={() => handlePressDeposit()}
            />
          )
        }
      }

      if (content) {
        return (
          <Animated.View
            style={{
              marginBottom: 14,
              marginRight: index % 2 === 0 ? 6 : 16,
              marginLeft: index % 2 !== 0 ? 6 : 16
            }}
            entering={getListItemEnteringAnimation(index)}
            layout={SPRING_LINEAR_TRANSITION}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [handleAddDeposit, handlePressDeposit, pChainNetworkToken]
  )

  const overrideProps = {
    contentContainerStyle: containerStyle
  }

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: theme.colors.$surfacePrimary,
          paddingBottom: 16
        }}>
        <Animated.View
          onLayout={onHeaderLayout}
          style={[
            {
              paddingHorizontal: 16,
              marginTop: 6,
              marginBottom: 16,
              backgroundColor: theme.colors.$surfacePrimary,
              gap: 7
            },
            animatedHeaderStyle
          ]}>
          <Text variant="heading2">Deposit</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Earn yield by depositing crypto into lending protocols and withdraw
            anytime.
          </Text>
        </Animated.View>
      </View>
    )
  }, [theme.colors.$surfacePrimary, onHeaderLayout, animatedHeaderStyle])

  useEffect(() => {
    if (scrollOffsetRef.current && isActive) {
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll(event)
    },
    [onScroll]
  )

  return (
    <FlashList
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark }} // force re-render when theme changes
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={renderHeader}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default DepositTabScreen
