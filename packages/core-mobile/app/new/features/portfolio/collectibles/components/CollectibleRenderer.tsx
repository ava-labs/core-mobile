import { Icons, useTheme, Video, VideoProps } from '@avalabs/k2-alpine'
import { useIsFocused } from '@react-navigation/native'
import { Image, ImageErrorEventData } from 'expo-image'
import React, {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { NftItem, NftLocalStatus } from 'services/nft/types'

export interface CollectibleRendererProps {
  collectible: NftItem
  children?: ReactNode
  style?: ViewStyle
  videoProps?: VideoProps
  onLoaded?: () => void
}

export const CollectibleRenderer = memo(
  ({
    collectible,
    children,
    onLoaded,
    videoProps,
    style
  }: CollectibleRendererProps): ReactNode => {
    const {
      theme: { colors }
    } = useTheme()

    const isFocused = useIsFocused()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      if (collectible.status === NftLocalStatus.Unprocessable) {
        setIsLoading(false)
      }
    }, [collectible.status])

    const onLoadEnd = useCallback((): void => {
      setIsLoading(false)
      if (isLoading) onLoaded?.()
    }, [isLoading, onLoaded])

    const onImageError = useCallback((event: ImageErrorEventData): void => {
      setError(event.error)
      setIsLoading(false)
    }, [])

    const onVideoError = useCallback((): void => {
      setIsLoading(false)
    }, [])

    const renderEdgeCases = useCallback(() => {
      if (error)
        return (
          <Icons.Content.HideImage
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        )
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

    const renderContent = useCallback(() => {
      if (collectible?.imageData?.video)
        return (
          <Animated.View
            style={[
              {
                width: '100%',
                height: '100%',
                zIndex: 1
              }
            ]}>
            {isFocused ? (
              <Video
                source={collectible?.imageData?.video}
                thumbnail={collectible?.imageData?.image}
                onLoadEnd={onLoadEnd}
                onError={onVideoError}
                {...videoProps}
              />
            ) : null}
          </Animated.View>
        )

      if (collectible?.imageData?.image) {
        return (
          <Animated.View
            style={[
              {
                width: '100%',
                height: '100%',
                zIndex: 1
              }
            ]}>
            <Image
              source={{
                uri: collectible?.imageData?.image
              }}
              onLoad={onLoadEnd}
              onError={onImageError}
              renderToHardwareTextureAndroid={false}
              style={{
                width: '100%',
                flex: 1
              }}
            />
          </Animated.View>
        )
      }

      return null
    }, [
      collectible?.imageData?.image,
      collectible?.imageData?.video,
      isFocused,
      onImageError,
      onLoadEnd,
      onVideoError,
      videoProps
    ])

    return (
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            height: '100%',
            overflow: 'hidden'
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
          {renderEdgeCases()}
        </View>

        {renderContent()}
        {isLoading ? null : children}
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
        width: '100%',
        height: '100%'
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
