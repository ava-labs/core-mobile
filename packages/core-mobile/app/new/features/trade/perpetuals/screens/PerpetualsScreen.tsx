import {
  ActivityIndicator,
  alpha,
  Chip,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { EventResponse } from '@avalabs/prediction-market-sdk'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { EventCard } from 'features/trade/predictions/components/EventCard'
import { useMarketSeries } from 'features/trade/predictions/hooks/useMarketSeries'
import {
  TRENDING_CHIP,
  usePredictionEvents
} from 'features/trade/predictions/hooks/usePredictionEvents'
import React, { useCallback, useMemo } from 'react'
import { ScrollView, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

export const PerpetualsScreen = ({
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

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const chips = useMemo(() => {
    const cats = series
      .map(s => s.category)
      .filter((c, i, arr) => arr.indexOf(c) === i)
    return [
      TRENDING_CHIP,
      'Live',
      'Sports',
      'Tech',
      'Finance',
      'Agriculture',
      ...cats
    ]
  }, [series])

  const renderHeader = useCallback(
    () => (
      <View
        sx={{
          paddingVertical: 14,
          backgroundColor: theme.colors.$surfacePrimary
        }}>
        <View
          style={{
            gap: 10,
            flexDirection: 'row',
            paddingRight: 16
          }}>
          <View sx={{ flex: 1 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row',
                gap: 8,
                paddingLeft: 16
              }}>
              {chips.map(chip => (
                <Chip
                  key={chip}
                  size="large"
                  variant={chip === selectedChip ? 'dark' : 'light'}
                  onPress={() => selectChip(chip)}>
                  {chip}
                </Chip>
              ))}
            </ScrollView>

            <LinearGradient
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 42,
                pointerEvents: 'none'
              }}
              colors={[
                theme.colors.$surfacePrimary,
                alpha(theme.colors.$surfacePrimary, 0)
              ]}
              start={{
                x: 1,
                y: 0
              }}
              end={{
                x: 0,
                y: 0
              }}
            />
          </View>

          <View
            sx={{
              backgroundColor: theme.colors.$surfaceSecondary,
              borderRadius: 20,
              height: 27,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
              paddingLeft: 10,
              paddingRight: 18
            }}>
            <Icons.Custom.Search
              fill={theme.colors.$textPrimary}
              width={14}
              height={14}
            />
            <Text
              variant="buttonSmall"
              sx={{ color: theme.colors.$textSecondary }}>
              Search
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      theme.colors.$surfacePrimary,
      theme.colors.$surfaceSecondary,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary,
      chips,
      selectedChip,
      selectChip
    ]
  )

  const renderItem = useCallback(
    ({ item }: { item: EventResponse }) => {
      return (
        <View sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}>
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
      testID="trade-perpetuals"
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
        contentContainerStyle={containerStyle}
        numColumns={2}
        extraData={{ selectedChip }}
        listKey="trade-perpetuals"
        onRefresh={refetch}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </Animated.View>
  )
}
