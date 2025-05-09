import {
  Icons,
  Image,
  Pressable,
  SCREEN_WIDTH,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { ListRenderItem } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'

import {
  ContentfulEducationArticle,
  useFeaturedEducationArticles
} from '../hooks/useEducationArticles'

import GlowBackground1 from '../../../assets/glow-background-1.png'
import GlowBackground2 from '../../../assets/glow-background-2.png'
import GlowBackground3 from '../../../assets/glow-background-3.png'
import GlowBackground4 from '../../../assets/glow-background-4.png'
import { CarouselItem } from './CarouselItem'

export const DiscoverLearn = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()
  const { theme } = useTheme()

  const { data, error, refetch } = useFeaturedEducationArticles()

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
    if (error)
      return (
        <Pressable
          onPress={() => refetch()}
          style={{
            height: 240,
            width: SCREEN_WIDTH - HORIZONTAL_MARGIN * 2,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <ErrorState
            icon={
              <Icons.Navigation.Refresh color={theme.colors.$textPrimary} />
            }
            title={``}
            description={`Content failed to load.\nTap to refresh`}
          />
        </Pressable>
      )
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
  }, [error, refetch, theme.colors.$textPrimary])

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
        nestedScrollEnabled
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
  if (index % 4 === 0) return GlowBackground1
  if (index % 4 === 1) return GlowBackground2
  if (index % 4 === 2) return GlowBackground3
  return GlowBackground4
}
