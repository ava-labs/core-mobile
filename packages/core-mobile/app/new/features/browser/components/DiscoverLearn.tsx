import { Image, View } from '@avalabs/k2-alpine'
import React, { ReactNode } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, AddHistoryPayload } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { CarouselItem } from './CarouselItem'

const LEARN_CARDS: AddHistoryPayload[] = [
  {
    title: "Browse some of Core user's frequently asked questions",
    url: 'https://www.enclave.market'
  },
  {
    title: 'Find all the tutorials you need about Core mobile',
    url: 'https://onbeam.com'
  },
  {
    title: 'Learn what Core web has to offer for a variety of users',
    url: 'https://onbeam.com'
  },
  {
    title:
      'Get familiar with the Core  extension wallet and all of its features',
    url: 'https://onbeam.com'
  },
  {
    title:
      'Get familiar with the Core  extension wallet and all of its features',
    url: 'https://onbeam.com'
  },
  {
    title:
      'Get familiar with the Core  extension wallet and all of its features',
    url: 'https://onbeam.com'
  }
]

function getBackgroundStyle(index: number): {
  width: number
  height: number
  rotate: number
  left: number
  top: number
} {
  const INITIAL_ROTATION = -90
  if (index % 4 === 0) {
    return {
      width: 344,
      height: 358,
      rotate: INITIAL_ROTATION - 120,
      left: 69,
      top: -186
    }
  }

  if (index % 4 === 1)
    return {
      width: 344,
      height: 358,
      rotate: INITIAL_ROTATION + 106,
      left: 99,
      top: -36
    }

  if (index % 4 === 2)
    return {
      width: 440,
      height: 358,
      rotate: INITIAL_ROTATION + 50,
      left: -78,
      top: 158
    }

  return {
    width: 344,
    height: 358,
    rotate: INITIAL_ROTATION - 86,
    left: -147,
    top: 163
  }
}

export const DiscoverLearn = (): ReactNode => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const handlePress = (item: AddHistoryPayload): void => {
    AnalyticsService.capture('BrowserDiscoverLearnTapped', {
      url: item.url
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.title,
        url: item.url
      })
    )
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<AddHistoryPayload> = ({ item, index }) => {
    const backgroundStyle = getBackgroundStyle(index)

    return (
      <CarouselItem
        title={item.title}
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
              source={require('../../../../assets/glow.png')}
              style={{
                ...backgroundStyle,
                transform: [
                  { rotate: `${backgroundStyle.rotate}deg` },
                  { scale: 1.6 }
                ]
              }}
            />
          </View>
        }
      />
    )
  }
  return (
    <View>
      <FlatList
        data={LEARN_CARDS}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          paddingBottom: 36,
          gap: 12
        }}
        horizontal
      />
    </View>
  )
}
