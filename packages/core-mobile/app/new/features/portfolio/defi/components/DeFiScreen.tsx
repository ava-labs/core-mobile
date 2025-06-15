import {
  Image,
  IndexPath,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Placeholder } from 'common/components/Placeholder'
import { HORIZONTAL_MARGIN } from 'common/consts'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import { HORIZONTAL_ITEM_GAP } from 'features/portfolio/collectibles/consts'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import React, { useCallback, useEffect, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { useDeFiProtocols } from '../hooks/useDeFiProtocols'
import { DeFiViewOption } from '../types'
import { DeFiListItem } from './DeFiListItem'

const placeholderIcon = require('../../../../assets/icons/bar_chart_emoji.png')

export const DeFiScreen = ({
  containerStyle,
  onScrollResync
}: {
  containerStyle: ViewStyle
  onScrollResync: () => void
}): JSX.Element => {
  const { navigate } = useRouter()
  const { openUrl } = useCoreBrowser()
  const {
    data,
    sort,
    view,
    isSuccess,
    error,
    isLoading,
    isRefreshing,
    isPaused,
    pullToRefresh,
    refetch,
    chainList
  } = useDeFiProtocols()

  const getAmount = useExchangedAmount()

  const isGridView =
    view.data[0]?.[view.selected.row] === DeFiViewOption.GridView
  const numColumns = isGridView ? 2 : 1

  useEffect(() => {
    if (isSuccess) {
      AnalyticsService.capture('DeFiAggregatorsCount', {
        count: data.length
      })
      // We want the resync to happen after the list is loaded
      onScrollResync()
    }
  }, [data, isSuccess, onScrollResync])

  const handlePressDeFiItem = useCallback(
    (item: DeFiSimpleProtocol): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/defiDetail',
        params: { protocolId: item.id }
      })
      AnalyticsService.capture('DeFiCardClicked')
    },
    [navigate]
  )

  const handlePressDeFiItemArrow = useCallback(
    (item: DeFiSimpleProtocol): void => {
      if (item.siteUrl) {
        openUrl({ url: item.siteUrl, title: item.name || '' })
      }
      AnalyticsService.capture('DeFiCardLaunchButtonlicked')
    },
    [openUrl]
  )

  const handleExplore = useCallback((): void => {
    openUrl({ url: 'https://core.app/discover/', title: 'Core Web' })
  }, [openUrl])

  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (error || (isPaused && !isSuccess)) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <ErrorState
            description="Please hit refresh or try again later"
            button={{
              title: 'Refresh',
              onPress: refetch
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return (
      <CollapsibleTabs.ContentWrapper height={Number(containerStyle.minHeight)}>
        <Placeholder
          icon={
            <Image source={placeholderIcon} sx={{ width: 42, height: 42 }} />
          }
          title="No positions yet"
          description="Discover a wide variety of apps, blockchains, wallets and explorers, built on the Avalanche ecosystem"
          button={{
            title: 'Explore DeFi',
            onPress: handleExplore
          }}
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [
    isLoading,
    error,
    isPaused,
    isSuccess,
    containerStyle.minHeight,
    handleExplore,
    refetch
  ])

  const renderItem: ListRenderItem<DeFiSimpleProtocol> = useCallback(
    ({ item, index }): JSX.Element => {
      const netUsdValue = getAmount(item.netUsdValue, 'compact')

      return (
        <DeFiListItem
          item={item}
          chain={chainList?.[item.chain]}
          index={index}
          onPress={() => handlePressDeFiItem(item)}
          onPressArrow={() => handlePressDeFiItemArrow(item)}
          formattedPrice={netUsdValue}
          isGridView={isGridView}
          style={{
            marginHorizontal: HORIZONTAL_ITEM_GAP / 2,
            marginBottom: isGridView ? 14 : 0
          }}
        />
      )
    },
    [
      getAmount,
      handlePressDeFiItem,
      handlePressDeFiItemArrow,
      chainList,
      isGridView
    ]
  )

  const header = useMemo(() => {
    if (data.length === 0) return

    return (
      <View
        sx={{
          alignSelf: 'center',
          width: SCREEN_WIDTH - HORIZONTAL_MARGIN * 2,
          marginBottom: isGridView ? 10 : 8
        }}>
        <DropdownSelections
          sort={sort}
          view={{
            ...view,
            onSelected: (indexPath: IndexPath) => {
              onScrollResync()
              view.onSelected(indexPath)
            }
          }}
        />
      </View>
    )
  }, [data.length, isGridView, onScrollResync, sort, view])

  const contentContainerStyle = {
    paddingHorizontal: !isGridView
      ? 0
      : data.length
      ? HORIZONTAL_MARGIN - HORIZONTAL_ITEM_GAP / 2
      : 0
  }

  // Fix for making the list scrollable if there are just a few collectibles
  // overrideProps and contentContainerStyle need to be both used with the same stylings for item width calculations
  const overrideProps = {
    contentContainerStyle: {
      flexGrow: 1,
      ...contentContainerStyle,
      ...containerStyle
    }
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabs.FlashList
        data={data}
        key={isGridView ? 'grid' : 'list'}
        keyExtractor={item => item.id}
        overrideProps={overrideProps}
        contentContainerStyle={contentContainerStyle}
        estimatedItemSize={isGridView ? 183 : 73}
        numColumns={numColumns}
        renderItem={renderItem}
        refreshing={isRefreshing}
        onRefresh={pullToRefresh}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  )
}
