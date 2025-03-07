import { ANIMATED, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { Image, ImageErrorEventData } from 'expo-image'
import React, { useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { NFTItem } from 'store/nft'

export const CollectibleRenderer = ({
  collectible,
  style
}: {
  collectible: NFTItem
  style?: ViewStyle
}): JSX.Element | JSX.Element[] => {
  const {
    theme: { colors, isDark }
  } = useTheme()

  const [isLoading, setIsLoading] = useState(
    !collectible?.imageData?.image?.length ||
      !collectible?.imageData?.video?.length
  )
  const [error, setError] = useState<string | null>(null)
  const [layout, setLayout] = useState({ width: 0, height: 0 })

  const onLoadEnd = (): void => {
    setIsLoading(false)
  }

  const onLoadStart = (): void => {
    setIsLoading(true)
  }

  const onError = (err: ImageErrorEventData): void => {
    setError(err.error)
    setIsLoading(false)
  }

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setLayout({ width, height })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  if (collectible?.imageData?.video) {
    return <Text variant="body1">{collectible?.imageData?.video}</Text>
  }

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          flex: 1,
          width: '100%',
          height: '100%'
        },
        style
      ]}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        {error ? (
          <Text variant="body1">{error}</Text>
        ) : isLoading ? (
          <ContentLoader
            speed={1}
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            foregroundColor={isDark ? '#69696D' : '#D9D9D9'}
            backgroundColor={isDark ? '#3E3E43' : '#F2F2F3'}>
            <Rect x="0" y="0" width={layout.width} height={layout.height} />
          </ContentLoader>
        ) : (
          <Icons.Content.HideImage
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        )}
      </View>

      <Animated.View
        style={[
          animatedStyle,
          {
            width: '100%',
            height: '100%',
            zIndex: 1
          }
        ]}>
        <Image
          key={`image-${collectible.uid}`}
          recyclingKey={`image-${collectible.uid}`}
          source={collectible?.imageData?.image}
          onLoadEnd={onLoadEnd}
          onLoadStart={onLoadStart}
          onError={onError}
          cachePolicy="memory-disk"
          contentFit="cover"
          style={{
            flex: 1,
            width: '100%',
            position: 'absolute',
            zIndex: 1,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      </Animated.View>
    </View>
  )
}
