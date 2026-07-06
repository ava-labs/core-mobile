import { Icons, useTheme, Video, VideoProps } from '@avalabs/k2-alpine'
import { useIsFocused } from 'expo-router'
import { Image, ImageErrorEventData } from 'expo-image'
import React, { memo, ReactNode, useCallback, useEffect, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { NftContentType, NftItem, NftLocalStatus } from 'services/nft/types'

export interface CollectibleRendererProps {
  collectible: NftItem
  children?: ReactNode
  style?: ViewStyle
  videoProps?: VideoProps
  onLoaded?: () => void
  iconSize?: number
  testID?: string
}

export const CollectibleRenderer = memo(
  ({
    collectible,
    children,
    onLoaded,
    videoProps,
    style,
    iconSize = 24,
    testID
  }: // eslint-disable-next-line sonarjs/cognitive-complexity
  CollectibleRendererProps): ReactNode => {
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
            width={iconSize}
            height={iconSize}
          />
        )
      if (isLoading) return <CollectibleSkeleton />
      if (collectible?.status === NftLocalStatus.Processed) return null

      return (
        <Icons.Content.HideImage
          color={colors.$textPrimary}
          width={iconSize}
          height={iconSize}
        />
      )
    }, [collectible?.status, colors.$textPrimary, error, iconSize, isLoading])

    const renderContent = useCallback(() => {
      const { uri, type } = collectible?.imageData ?? {}

      if (!uri) return null

      if (type === NftContentType.MP4)
        return (
          <Animated.View
            // On Android the native video view consumes touches. For
            // non-interactive previews (grid/list, `hideControls: true`) we must
            // let taps fall through to the wrapping Pressable, so disable pointer
            // events. For interactive usages (e.g. CollectibleDetail, where
            // `hideControls` is falsy and the player shows controls) we must KEEP
            // pointer events so the video receives touches for pause/resume.
            pointerEvents={videoProps?.hideControls ? 'none' : 'auto'}
            style={[
              {
                width: '100%',
                height: '100%',
                zIndex: 1
              }
            ]}>
            {isFocused ? (
              <Video
                source={uri}
                onLoadEnd={onLoadEnd}
                onError={onVideoError}
                {...videoProps}
              />
            ) : null}
          </Animated.View>
        )

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
            source={{ uri }}
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
    }, [
      collectible?.imageData,
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
          testID={testID}
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

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setLayout({ width, height })
  }

  return (
    <View
      onLayout={onLayout}
      style={{
        width: '100%',
        height: '100%'
      }}>
      {layout.width > 0 && layout.height > 0 ? (
        <ContentLoader
          speed={1}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          foregroundColor={isDark ? '#69696D' : '#D9D9D9'}
          backgroundColor={isDark ? '#3E3E43' : '#F2F2F3'}>
          <Rect x="0" y="0" width={layout.width} height={layout.height} />
        </ContentLoader>
      ) : null}
    </View>
  )
}
