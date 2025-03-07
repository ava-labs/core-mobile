import { ANIMATED, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { Image, ImageErrorEventData } from 'expo-image'
import React, { useState } from 'react'
import { ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { NFTItem } from 'store/nft'

export const CollectibleRenderer = ({
  collectible,
  style,
  imageUrl,
  videoUrl
}: {
  collectible: NFTItem
  style?: ViewStyle
  imageUrl?: string
  videoUrl?: string
}): JSX.Element | JSX.Element[] => {
  const {
    theme: { colors }
  } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  const onLoadEnd = (): void => {
    setIsLoading(false)
  }

  const onLoadStart = (): void => {
    setIsLoading(true)
  }

  const onError = (err: ImageErrorEventData): void => {
    setError(err.error)
  }

  if (collectible?.imageData?.video || videoUrl) {
    return <Text variant="body1">{videoUrl}</Text>
  }

  return (
    <View
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
          <Text>{error}</Text>
        ) : isLoading ? (
          <LoadingState />
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
          style={{
            flex: 1,
            width: '100%',
            borderRadius: 18,
            position: 'absolute',
            zIndex: 1,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          cachePolicy="memory-disk"
          source={collectible?.imageData?.image || imageUrl}
          contentFit="cover"
          onLoadEnd={onLoadEnd}
          onLoadStart={onLoadStart}
          onError={onError}
        />
      </Animated.View>
    </View>
  )
}
