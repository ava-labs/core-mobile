import { useQuery } from '@tanstack/react-query'
import { LoadingState } from 'common/components/LoadingState'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, selectIsTabEmpty } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulAsset,
  ContentfulEcosystemProject,
  fetchEcosystemProjects
} from '../hooks/useContentful'
import { CarouselItem } from './CarouselItem'

export const DiscoverDapps = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()
  const showEmptyTab = useSelector(selectIsTabEmpty)

  const { data, error } = useQuery({
    queryKey: ['discover-dapps'],
    queryFn: fetchEcosystemProjects
  })

  const randomisedItems = useMemo(
    () =>
      data?.items
        ?.filter(item => !item.fields.hideOnMobile)
        ?.sort(() => Math.random() - 0.5) || [],
    // Needed for randomization to work when the tab is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.items, showEmptyTab]
  )

  const handlePress = (item: ContentfulEcosystemProject): void => {
    AnalyticsService.capture('BrowserDiscoverDAppTapped', {
      url: item.fields.website ?? ''
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.fields.name ?? '',
        url: item.fields.website ?? ''
      })
    )
    handleUrlSubmit?.(item.fields.website ?? '')
  }

  const renderItem: ListRenderItem<ContentfulEcosystemProject> = ({ item }) => {
    const logoUrl = `https:${
      data?.includes.Asset.find(
        (asset: ContentfulAsset) => asset.sys.id === item.fields.logo?.sys.id
      )?.fields.file.url
    }`

    return (
      <CarouselItem
        title={item.fields.name}
        image={logoUrl}
        description={item.fields?.description}
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
        keyExtractor={item => item.fields.name}
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
