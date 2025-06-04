import {
  Image,
  IndexPath,
  Separator,
  SPRING_LINEAR_TRANSITION,
  View
} from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { Placeholder } from 'common/components/Placeholder'
import { Space } from 'common/components/Space'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import React, { useCallback, useEffect, useMemo } from 'react'
import { ListRenderItemInfo, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { portfolioTabContentHeight } from '../../utils'
import { useDeFiProtocols } from '../hooks/useDeFiProtocols'
import { DeFiViewOption } from '../types'
import { DeFiListItem } from './DeFiListItem'

const placeholderIcon = require('../../../../assets/icons/bar_chart_emoji.png')

export const DeFiScreen = ({
  onReset
}: {
  onReset: () => void
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
    }
  }, [data, isSuccess])

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
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (error || (isPaused && !isSuccess)) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refetch
          }}
        />
      )
    }

    return (
      <Placeholder
        icon={<Image source={placeholderIcon} sx={{ width: 42, height: 42 }} />}
        title="No positions yet"
        description="Discover a wide variety of apps, blockchains, wallets and explorers, built on the Avalanche ecosystem"
        button={{
          title: 'Explore DeFi',
          onPress: handleExplore
        }}
        sx={{ height: portfolioTabContentHeight }}
      />
    )
  }, [isLoading, error, refetch, handleExplore, isPaused, isSuccess])

  const renderItem = useCallback(
    (item: ListRenderItemInfo<DeFiSimpleProtocol>): JSX.Element => {
      const netUsdValue = getAmount(item.item.netUsdValue, 'compact')

      return (
        <DeFiListItem
          item={item.item}
          chain={chainList?.[item.item.chain]}
          index={item.index}
          onPress={() => handlePressDeFiItem(item.item)}
          onPressArrow={() => handlePressDeFiItemArrow(item.item)}
          formattedPrice={netUsdValue}
          isGridView={isGridView}
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

  const dataLength = data.length

  const header = useMemo(() => {
    if (dataLength === 0) return

    return (
      <View sx={styles.dropdownContainer}>
        <DropdownSelections
          sort={sort}
          view={{
            ...view,
            onSelected: (indexPath: IndexPath) => {
              onReset()
              view.onSelected(indexPath)
            }
          }}
          sx={{
            marginTop: 4,
            marginBottom: isGridView ? 16 : 8
          }}
        />
      </View>
    )
  }, [dataLength, isGridView, onReset, sort, view])

  const renderSeparator = useCallback((): JSX.Element => {
    return isGridView ? <Space y={12} /> : <Separator sx={{ marginLeft: 62 }} />
  }, [isGridView])

  const columnWrapperStyle = useMemo(() => {
    if (!isGridView) return

    return {
      paddingHorizontal: 16,
      gap: 14
    }
  }, [isGridView])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabs.FlatList
        contentContainerStyle={styles.container}
        data={data}
        numColumns={numColumns}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={pullToRefresh}
        key={isGridView ? 'grid' : 'list'}
        keyExtractor={item => item.id}
        columnWrapperStyle={columnWrapperStyle}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { overflow: 'visible', paddingBottom: 16 },
  dropdownContainer: {
    paddingHorizontal: 16
  }
})
