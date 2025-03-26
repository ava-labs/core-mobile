import { ANIMATED, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { Video } from '@avalabs/k2-alpine/src/components/Video/Video'
import { Image, ImageErrorEventData } from 'expo-image'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo
} from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { NftItem, NftLocalStatus } from 'services/nft/types'

export const CollectibleRenderer = memo(
  ({
    collectible,
    children,
    onLoaded,
    style
  }: {
    collectible: NftItem
    children?: ReactNode
    style?: ViewStyle
    onLoaded?: () => void
  }): ReactNode => {
    const {
      theme: { colors }
    } = useTheme()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      if (collectible.status === NftLocalStatus.Unprocessable) {
        setIsLoading(false)
      }
    }, [collectible.status])

    const onLoadEnd = useCallback((): void => {
      if (isLoading) onLoaded?.()
      setIsLoading(false)
    }, [isLoading, onLoaded])

    const onLoadStart = useCallback((): void => {
      setIsLoading(true)
    }, [])

    const onImageError = useCallback((err: ImageErrorEventData): void => {
      setError(err.error)
      setIsLoading(false)
    }, [])

    const onVideoError = useCallback((): void => {
      setIsLoading(false)
    }, [])

    const contentStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(isLoading ? 0 : 1, ANIMATED.TIMING_CONFIG)
      }
    })

    const renderEdgeCases = useMemo((): ReactNode => {
      if (error) return <Text variant="body2">{error}</Text>
      if (isLoading) return <CollectibleSkeleton />
      if (collectible?.status === NftLocalStatus.Processed) return null

      return (
        <Icons.Content.HideImage
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      )
    }, [collectible?.status, colors.$textPrimary, error, isLoading])

    const renderContent = useMemo(() => {
      if (collectible?.imageData?.video)
        return (
          <Animated.View
            style={[
              contentStyle,
              {
                width: '100%',
                height: '100%',
                zIndex: 1
              }
            ]}>
            <Video
              source={collectible?.imageData?.video}
              thumbnail={collectible?.imageData?.image}
              onLoadEnd={onLoadEnd}
              onError={onVideoError}
              autoPlay={false}
              muted
              hideControls
            />
            {children}
          </Animated.View>
        )

      if (collectible?.imageData?.image) {
        return (
          <Animated.View
            style={[
              contentStyle,
              {
                width: '100%',
                height: '100%',
                zIndex: 1
              }
            ]}>
            <Image
              key={collectible.localId}
              recyclingKey={collectible.localId}
              source={collectible?.imageData?.image}
              onDisplay={onLoadEnd}
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
            {children}
          </Animated.View>
        )
      }

      return null
    }, [
      children,
      collectible?.imageData?.image,
      collectible?.imageData?.video,
      collectible.localId,
      contentStyle,
      onImageError,
      onLoadEnd,
      onLoadStart,
      onVideoError
    ])

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
          {renderEdgeCases}
        </View>

        {renderContent}
      </View>
    )
  }
)

const CollectibleSkeleton = (): ReactNode => {
  const {
    theme: { isDark }
  } = useTheme()
  const [layout, setLayout] = useState({ width: 0, height: 0 })

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
      style={{
        flex: 1
      }}>
      <ContentLoader
        speed={1}
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        foregroundColor={isDark ? '#69696D' : '#D9D9D9'}
        backgroundColor={isDark ? '#3E3E43' : '#F2F2F3'}>
        <Rect x="0" y="0" width={layout.width} height={layout.height} />
      </ContentLoader>
    </View>
  )
}
