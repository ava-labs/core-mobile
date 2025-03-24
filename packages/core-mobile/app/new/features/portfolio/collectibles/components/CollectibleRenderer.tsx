import { ANIMATED, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { Video } from '@avalabs/k2-alpine/src/components/Video/Video'
import { Image, ImageErrorEventData } from 'expo-image'
import React, {
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { ViewStyle, View, LayoutChangeEvent } from 'react-native'
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
}): ReactNode => {
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

  const onImageError = (err: ImageErrorEventData): void => {
    setError(err.error)
    setIsLoading(false)
  }

  const onVideoError = (): void => {
    setIsLoading(false)
  }

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLoading ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  const renderEdgeCases = useMemo((): ReactNode => {
    if (error) return <Text variant="body2">{error}</Text>
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
    if (collectible?.imageData?.video)
      return (
        <Video
          source={collectible?.imageData?.video}
          thumbnail={collectible?.imageData?.image}
          onLoadEnd={onLoadEnd}
          onError={onVideoError}
          autoPlay={false}
          muted
          hideControls
        />
      )

    return (
      <Image
        key={`image-${collectible.localId}`}
        // recyclingKey={`image-${collectible.localId}`}
        source={collectible?.imageData?.image}
        onLoadEnd={onLoadEnd}
        onLoadStart={onLoadStart}
        onError={onImageError}
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

  const contentRef = useRef<View>(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.measure(
        (x: number, y: number, width: number, height: number) => {
          setLayout({ width, height })
        }
      )
    }
  }, [])

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setLayout({ width, height })
  }

  return (
    <View
      ref={contentRef}
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

      {collectible?.imageData?.image || collectible?.imageData?.video ? (
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
          {children}
        </Animated.View>
      ) : null}
    </View>
  )
}
