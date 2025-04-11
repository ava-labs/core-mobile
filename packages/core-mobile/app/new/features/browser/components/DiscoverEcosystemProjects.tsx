import { LoadingState } from 'common/components/LoadingState'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, selectIsTabEmpty } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { ContentfulEcosystemProject } from '../hooks/useContentful'
import { useEcosystemProjects } from '../hooks/useEcosystemProjects'
import { CarouselItem } from './CarouselItem'

export const DiscoverEcosystemProjects = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const { data, error } = useEcosystemProjects()

  const showEmptyTab = useSelector(selectIsTabEmpty)

  const randomisedItems = useMemo(
    () => {
      const newItems = [...(data?.items || [])]
      return newItems
        ?.filter(item => !item?.hideOnMobile)
        ?.sort(() => Math.random() - 0.5)
    },

    // Needed for randomization to work when the tab is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.items, showEmptyTab]
  )

  const handlePress = (item: ContentfulEcosystemProject): void => {
    AnalyticsService.capture('BrowserDiscoverEcosystemProjectTapped', {
      url: item.website ?? ''
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.name ?? '',
        url: item.website ?? ''
      })
    )
    handleUrlSubmit?.(item.website ?? '')
  }

  const renderItem: ListRenderItem<ContentfulEcosystemProject> = ({ item }) => {
    return (
      <CarouselItem
        title={item.name}
        image={item.logo?.url}
        description={item.description}
        onPress={() => handlePress(item)}
      />
    )
  }

  const renderEmpty = useCallback((): ReactNode => {
    if (error) return <LoadingState />
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12
        }}>
        <CarouselItem loading />
        <CarouselItem loading />
        <CarouselItem loading />
        <CarouselItem loading />
      </View>
    )
  }, [error])

  return (
    <View>
      <FlatList
        data={randomisedItems}
        renderItem={renderItem}
        keyExtractor={item => item.name}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingVertical: 36,
          gap: HORIZONTAL_MARGIN
        }}
        horizontal
        ListEmptyComponent={renderEmpty}
      />
    </View>
  )
}
