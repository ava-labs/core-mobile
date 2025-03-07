import { ANIMATED, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { Image, ImageErrorEventData } from 'expo-image'
import React, { ReactNode, useMemo, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { NftItem } from 'services/nft/types'

export const CollectibleRenderer = ({
  collectible,
  children,
  style
}: {
  collectible: NftItem
  children?: ReactNode
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

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  const renderEdgeCases = useMemo((): ReactNode => {
    if (error) return <Text variant="body1">{error}</Text>
    if (isLoading)
      return (
        <ContentLoader
          speed={1}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          foregroundColor={isDark ? '#69696D' : '#D9D9D9'}
          backgroundColor={isDark ? '#3E3E43' : '#F2F2F3'}>
          <Rect x="0" y="0" width={layout.width} height={layout.height} />
        </ContentLoader>
      )

    return (
      <Icons.Content.HideImage
        color={colors.$textPrimary}
        width={24}
        height={24}
      />
    )
  }, [
    colors.$textPrimary,
    error,
    isDark,
    isLoading,
    layout.height,
    layout.width
  ])

  const renderContent = useMemo(() => {
    if (collectible?.imageData?.video) return <Text variant="body1">Video</Text>

    return (
      <Image
        key={`image-${collectible.localId}`}
        recyclingKey={`image-${collectible.localId}`}
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
    )
  }, [
    collectible?.imageData?.image,
    collectible?.imageData?.video,
    collectible.localId
  ])

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
        {renderEdgeCases}
      </View>

      <Animated.View
        style={[
          contentStyle,
          {
            width: '100%',
            height: '100%',
            zIndex: 1
          }
        ]}>
        {renderContent}
        {collectible?.imageData?.image || collectible?.imageData?.video
          ? children
          : null}
      </Animated.View>
    </View>
  )
}
