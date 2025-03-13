import React, { useEffect, useMemo } from 'react'
import { View, Image, Separator } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { useRouter } from 'expo-router'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { openURL } from 'utils/openURL'
import Logger from 'utils/Logger'
import { Placeholder } from 'common/components/Placeholder'
import { ListRenderItemInfo } from 'react-native'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { Space } from 'components/Space'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { portfolioTabContentHeight } from '../../utils'
import { DeFiViewOption } from '../types'
import { useDeFiProtocols } from '../hooks/useDeFiProtocols'
import { DeFiListItem } from './DeFiListItem'

export const DeFiScreen = (): JSX.Element => {
  const { navigate } = useRouter()
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

  useEffect(() => {
    if (isSuccess) {
      AnalyticsService.capture('DeFiAggregatorsCount', {
        count: data.length
      })
    }
  }, [data, isSuccess])

  const handlePressDeFiItem = (item: DeFiSimpleProtocol): void => {
    navigate({
      pathname: '/defiDetail',
      params: { protocolId: item.id }
    })
    AnalyticsService.capture('DeFiCardClicked')
  }

  const handlePressDeFiItemArrow = (item: DeFiSimpleProtocol): void => {
    openURL(item.siteUrl)
    AnalyticsService.capture('DeFiCardLaunchButtonlicked')
  }

  const handleExplore = (): void => {
    openURL('https://core.app/discover/').catch(Logger.error)
  }

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
        icon={
          <Image
            source={require('../../../../assets/icons/bar_chart_emoji.png')}
            sx={{ width: 42, height: 42 }}
          />
        }
        title="No investments yet"
        description="Discover a wide variety of apps, blockchains, wallets and explorers, built on the Avalanche ecosystem"
        button={{
          title: 'Explore DeFi',
          onPress: handleExplore
        }}
        sx={{ height: portfolioTabContentHeight }}
      />
    )
  }, [isLoading, error, refetch, isPaused, isSuccess])

  const renderItem = (
    item: ListRenderItemInfo<DeFiSimpleProtocol>
  ): JSX.Element => {
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
  }

  const header = useMemo(() => {
    return (
      <View
        sx={{
          paddingHorizontal: 16
        }}>
        <DropdownSelections
          sort={sort}
          view={view}
          sx={{
            marginTop: 20,
            marginBottom: isGridView ? 16 : 8
          }}
        />
      </View>
    )
  }, [isGridView, sort, view])

  const renderSeparator = (): JSX.Element => {
    return isGridView ? <Space y={12} /> : <Separator sx={{ marginLeft: 62 }} />
  }

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{ overflow: 'visible', paddingBottom: 16 }}
      data={data}
      numColumns={isGridView ? 2 : 1}
      renderItem={renderItem}
      ListHeaderComponent={data.length > 0 ? header : undefined}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      refreshing={isRefreshing}
      onRefresh={pullToRefresh}
      key={isGridView ? 'grid' : 'list'}
      keyExtractor={item => item.id}
      columnWrapperStyle={
        isGridView && {
          paddingHorizontal: 16,
          gap: 14
        }
      }
    />
  )
}
