import { ActivityIndicator, useTheme, View } from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { EventResponse } from '@avalabs/prediction-market-sdk'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import {
  TradeFilterChip,
  TradeFilters
} from 'features/trade/components/TradeFilters'
import React, { useCallback, useMemo, useRef } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { EventCard } from '../components/EventCard'
import { useMarketSeries } from '../hooks/useMarketSeries'
import {
  TRENDING_CHIP,
  usePredictionEvents
} from '../hooks/usePredictionEvents'

export const PredictionsScreen = ({
  containerStyle
}: {
  containerStyle: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const { series } = useMarketSeries()

  const {
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    selectedChip,
    filteredEvents,
    selectChip
  } = usePredictionEvents()

  const listContentStyle = useMemo(
    () => ({ ...containerStyle, paddingHorizontal: 9 }),
    [containerStyle]
  )

  const filterScrollOffsetRef = useRef(0)

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const chips = useMemo<TradeFilterChip[]>(() => {
    const cats = series
      .map(s => s.category)
      .filter((c, i, arr) => arr.indexOf(c) === i)
    // TODO: Replace the hardcoded chips with categories returned by the
    // prediction-market-sdk once it exposes them.
    const labels = Array.from(
      new Set([
        TRENDING_CHIP,
        'Live',
        'Sports',
        'Tech',
        'Finance',
        'Agriculture',
        ...cats
      ])
    )
    return labels.map(label =>
      label === 'Live'
        ? {
            label,
            renderLeft: () => (
              <View
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.$accentRed
                }}
              />
            )
          }
        : label
    )
  }, [series])

  const renderHeader = useCallback(
    () => (
      <View
        sx={{
          marginHorizontal: -9
        }}>
        <TradeFilters
          chips={chips}
          selectedChip={selectedChip}
          onSelectChip={selectChip}
          scrollOffsetRef={filterScrollOffsetRef}
        />
      </View>
    ),
    [chips, selectedChip, selectChip]
  )

  const renderItem = useCallback(
    ({ item }: { item: EventResponse }) => {
      return (
        <View
          sx={{
            flex: 1,
            paddingHorizontal: 7,
            marginBottom: 14
          }}>
          <EventCard
            event={item}
            onPress={() => {
              router.push({
                pathname: '/marketDetail',
                params: { tickerId: item.eventTicker }
              })
            }}
          />
        </View>
      )
    },
    [router]
  )

  const keyExtractor = useCallback(
    (item: EventResponse) => item.eventTicker,
    []
  )

  const renderEmptyComponent = useCallback(
    () => (
      <CollapsibleTabs.ContentWrapper>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.$textPrimary} />
        ) : (
          <ErrorState
            description="Please hit refresh or try again later"
            button={{
              title: 'Refresh',
              onPress: refetch
            }}
          />
        )}
      </CollapsibleTabs.ContentWrapper>
    ),
    [isLoading, refetch, theme.colors.$textPrimary]
  )

  return (
    <Animated.View
      testID="trade-predictions"
      entering={getListItemEnteringAnimation(10)}
      style={{
        flex: 1
      }}>
      <CollapsibleTabList
        data={filteredEvents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderEmpty={renderEmptyComponent}
        isRefreshing={isRefreshing}
        renderHeader={renderHeader}
        contentContainerStyle={listContentStyle}
        numColumns={2}
        extraData={{ selectedChip }}
        listKey="trade-predictions"
        onRefresh={refetch}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </Animated.View>
  )
}
