import {
  AddCard,
  GRID_GAP,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import {
  getListItemEnteringAnimation,
  getListItemExitingAnimation
} from 'common/utils/animations'
import { transactionSnackbar } from 'common/utils/toast'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { LoadingState } from 'common/components/LoadingState'
import { DropdownSelections } from 'common/components/DropdownSelections'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { BorrowProtocolSelector } from '../BorrowProtocolSelector'
import { BorrowCard } from '../BorrowCard'
import { BorrowSummaryBanner } from '../BorrowSummaryBanner'
import { useBorrowsFilterAndSort } from '../../hooks/useBorrowsFilterAndSort'
import { BorrowPosition, BorrowSummary, MarketName } from '../../types'

export interface BorrowTabScreenProps {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  onHeaderLayout: (event: LayoutChangeEvent) => void
  animatedHeaderStyle: { opacity: number }
  containerStyle?: StyleProp<ViewStyle>
  isActive: boolean
}

export type BorrowContentState = {
  positions: BorrowPosition[]
  summary: BorrowSummary | undefined
  isLoading: boolean
  isRefreshing: boolean
  refresh: () => void
}

type BorrowTabContentProps = BorrowTabScreenProps & {
  selectedProtocol: MarketName
  contentState: BorrowContentState
}

export const BorrowTabContent = ({
  selectedProtocol,
  contentState,
  onScroll,
  onHeaderLayout,
  animatedHeaderStyle,
  containerStyle,
  isActive
}: BorrowTabContentProps): JSX.Element => {
  const { positions, summary, isLoading, isRefreshing, refresh } = contentState
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const { data: filteredBorrows, sort } = useBorrowsFilterAndSort({
    borrows: positions
  })

  const data: BorrowCardType[] = useMemo(() => {
    return isLoading ? [] : [StaticCard.Add, ...filteredBorrows]
  }, [filteredBorrows, isLoading])

  const handleAddBorrow = useCallback(() => {
    AnalyticsService.capture('EarnBorrowStart')
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/borrow' })
  }, [navigate])

  const handleRepayBorrow = useCallback(() => {
    transactionSnackbar.plain({ message: 'Repay flow is coming soon' })
  }, [])

  const handlePressHealthScore = useCallback(() => {
    if (summary?.healthScore === undefined) {
      return
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/borrow/healthScoreExplained',
      params: {
        healthScore: summary.healthScore.toString()
      }
    })
  }, [navigate, summary?.healthScore])

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<BorrowCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = <AddCard width={CARD_WIDTH} onPress={handleAddBorrow} />
      } else {
        content = (
          <BorrowCard
            market={item.market}
            borrowedAmountUsd={item.borrowedAmountUsd}
            width={CARD_WIDTH}
            onRepayPress={handleRepayBorrow}
          />
        )
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
            exiting={getListItemExitingAnimation(index)}
            layout={SPRING_LINEAR_TRANSITION}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [handleAddBorrow, handleRepayBorrow]
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
              paddingHorizontal: 14,
              marginTop: 6,
              marginBottom: 10,
              backgroundColor: theme.colors.$surfacePrimary,
              gap: 7
            },
            animatedHeaderStyle
          ]}>
          <BorrowProtocolSelector />
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Take a loan against your deposits and repay anytime.
          </Text>
        </Animated.View>
        {summary && (
          <BorrowSummaryBanner
            summary={summary}
            protocol={selectedProtocol}
            onHealthScorePress={handlePressHealthScore}
          />
        )}
        <DropdownSelections
          sort={sort}
          sx={{ paddingHorizontal: 16, marginTop: 4 }}
        />
      </View>
    )
  }, [
    animatedHeaderStyle,
    onHeaderLayout,
    sort,
    summary,
    selectedProtocol,
    handlePressHealthScore,
    theme.colors.$surfacePrimary
  ])

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
      keyExtractor={item =>
        item === StaticCard.Add ? 'add-borrow' : item.market.uniqueMarketId
      }
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark }}
      onRefresh={refresh}
      refreshing={isRefreshing}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={<LoadingState sx={{ height: 500 }} />}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}

type BorrowItem = BorrowPosition
type BorrowCardType = StaticCard | BorrowItem

const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)
