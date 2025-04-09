import React, { ReactNode, useMemo } from 'react'
import { FlatList, ListRenderItem, View } from 'react-native'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulProject,
  useFeaturedProjects
} from '../hooks/useFeaturedProjects'
import { CarouselItem } from './CarouselItem'

export const DiscoverSuggested = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()
  const { data } = useFeaturedProjects()

  const handlePress = (item: ContentfulProject): void => {
    AnalyticsService.capture('BrowserDiscoverDAppTapped', {
      url: item.fields.website
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.fields.name,
        url: item.fields.website
      })
    )
    handleUrlSubmit?.(item.fields.website)
  }

  const renderItem: ListRenderItem<ContentfulProject> = ({ item }) => {
    const logoUrl = `https:${
      data?.includes.Asset.find(
        (asset: any) => asset.sys.id === item.fields.logo.sys.id
      )?.fields.file.url
    }`

    return (
      <CarouselItem
        title={item.fields.name}
        image={logoUrl}
        description={item.fields.description}
        onPress={() => handlePress(item)}
      />
    )
  }

  const randomisedItems = useMemo(
    () => data?.items.sort(() => Math.random() - 0.5),
    [data?.items]
  )

  return (
    <View>
      <FlatList
        data={randomisedItems}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingVertical: 36,
          gap: HORIZONTAL_MARGIN
        }}
        horizontal
      />
    </View>
  )
}
