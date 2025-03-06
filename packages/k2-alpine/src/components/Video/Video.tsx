import React from 'react'
import { Pressable } from 'dripsy'
import { Image } from 'expo-image'
import { VideoView, VideoViewProps, useVideoPlayer } from 'expo-video'
import { useEffect, useState } from 'react'
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { TIMING_CONFIG } from '../../utils'
import { View } from '../Primitives'

export const Video = ({
  source,
  thumbnail,
  onLoadEnd,
  onError,
  ...props
}: {
  source: string
  thumbnail?: string
  onLoadEnd: () => void
  onError: () => void
} & Omit<VideoViewProps, 'player'>): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState(false)

  const player = useVideoPlayer(source, player => {
    player.loop = true
  })

  const playButtonStyle = useAnimatedStyle(() => {
    const scale = withSpring(isPlaying ? 0.8 : 1, {
      mass: 0.5,
      damping: 15
    })

    return {
      // opacity,
      transform: [{ scale }]
    }
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
        flex: 1,
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
      <Animated.View style={[{ position: 'absolute' }, playButtonStyle]}>
        <Pressable
          onPress={togglePlay}
          style={{
            width: 30,
            height: 30,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          {/* <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={14}
            color="white"
          /> */}
        </Pressable>
      </Animated.View>
    </View>
  )
}
