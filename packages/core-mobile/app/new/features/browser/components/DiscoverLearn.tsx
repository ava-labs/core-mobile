import { Image, View } from '@avalabs/k2-alpine'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from 'common/components/LoadingState'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulEducationArticle,
  fetchEducationArticles
} from '../hooks/useContentful'
import { CarouselItem } from './CarouselItem'

export const DiscoverLearn = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const { data, error } = useQuery({
    queryKey: ['discover-learn'],
    queryFn: fetchEducationArticles
  })

  const items = useMemo(() => data?.items || [], [data?.items])

  const handlePress = (item: ContentfulEducationArticle): void => {
    AnalyticsService.capture('BrowserDiscoverLearnTapped', {
      url: item.url
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.headline,
        url: item.url
      })
    )
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<ContentfulEducationArticle> = ({
    item,
    index
  }) => {
    const backgroundUrl = getBackgroundUrl(index)

    return (
      <CarouselItem
        title={item.headline}
        onPress={() => handlePress(item)}
        renderImage={
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}>
            <Image
              source={backgroundUrl}
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </View>
        }
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
        data={items}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingBottom: 36,
          gap: 12
        }}
        horizontal
        ListEmptyComponent={renderEmpty}
      />
    </View>
  )
}

function getBackgroundUrl(index: number): {
  width: number
  height: number
  rotate: number
  left: number
  top: number
} {
  if (index % 4 === 0) return require('../../../assets/glow-background-1.png')
  if (index % 4 === 1) return require('../../../assets/glow-background-2.png')
  if (index % 4 === 2) return require('../../../assets/glow-background-3.png')
  return require('../../../assets/glow-background-4.png')
}
