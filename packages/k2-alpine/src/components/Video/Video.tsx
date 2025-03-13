import React from 'react'
import { Pressable } from 'dripsy'
import { Image } from 'expo-image'
import { VideoView, VideoViewProps, useVideoPlayer } from 'expo-video'
import { useEffect, useState } from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { TIMING_CONFIG } from '../../utils'
import { View } from '../Primitives'

export const Video = ({
  source,
  thumbnail,
  hideControls,
  onLoadEnd,
  autoPlay,
  muted,
  onError,
  ...props
}: {
  source: string
  thumbnail?: string
  hideControls?: boolean
  muted?: boolean
  autoPlay?: boolean
  onLoadEnd: () => void
  onError: () => void
} & Omit<VideoViewProps, 'player'>): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState(false)

  const player = useVideoPlayer(source, videoPlayer => {
    videoPlayer.loop = true
    videoPlayer.muted = muted ?? false
    if (autoPlay) videoPlayer.play()
  })

  const thumbnailStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isPlaying ? 0 : 1, TIMING_CONFIG),
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }
  })

  const togglePlay = (): void => {
    if (hideControls) return
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
    setIsPlaying(!isPlaying)
  }

  useEffect(() => {
    switch (player.status) {
      case 'readyToPlay':
        onLoadEnd()
        break

      case 'error':
        onError()
        break
    }
  }, [onError, onLoadEnd, player.status])

  return (
    <View
      style={{
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <VideoView
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        contentFit="cover"
        nativeControls={false}
        player={player}
        {...props}
      />
      {thumbnail && (
        <Animated.View style={thumbnailStyle}>
          <Image
            source={{ uri: thumbnail }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      )}
      <Pressable
        onPress={togglePlay}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
    </View>
  )
}
