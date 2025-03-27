import { Pressable } from 'dripsy'
import { useEvent } from 'expo'
import { VideoView, VideoViewProps, useVideoPlayer } from 'expo-video'
import React, { useEffect } from 'react'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'
import { View } from '../Primitives'
import { colors } from '../../theme/tokens/colors'

export interface VideoProps extends Omit<VideoViewProps, 'player'> {
  source?: string
  thumbnail?: string
  hideControls?: boolean
  muted?: boolean
  autoPlay?: boolean
  onLoadEnd?: () => void
  onError?: () => void
}

export const Video = ({
  source,
  thumbnail,
  hideControls,
  onLoadEnd,
  autoPlay,
  muted,
  onError,
  ...props
}: VideoProps): JSX.Element => {
  const { theme } = useTheme()
  const player = useVideoPlayer(source || '', videoPlayer => {
    videoPlayer.loop = true
    videoPlayer.muted = muted ?? false
    if (autoPlay) videoPlayer.play()
  })

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing
  })

  const togglePlay = (): void => {
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }

  const toggleMute = (): void => {
    player.muted = !player.muted
  }

  useEffect(() => {
    switch (player.status) {
      case 'readyToPlay':
        onLoadEnd?.()
        break

      case 'error':
        onError?.()
        break
    }
  }, [onError, onLoadEnd, player.status])

  return (
    <View
      style={{
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
      <VideoView
        style={{
          width: '100%',
          height: '100%'
        }}
        contentFit="cover"
        nativeControls={false}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        allowsVideoFrameAnalysis={false}
        {...props}
      />

      <Pressable
        onPress={togglePlay}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        disabled={hideControls}
      />
      {hideControls ? null : (
        <Pressable
          onPress={toggleMute}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }}
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            backgroundColor: alpha(colors.$neutral850, 0.8),
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
            width: 24,
            height: 24,
            zIndex: 10
          }}>
          {player.muted ? (
            <Icons.Action.VolumeOff
              color={theme.colors?.$surfacePrimary}
              width={16}
              height={16}
            />
          ) : (
            <Icons.Action.VolumeOn
              color={theme.colors?.$surfacePrimary}
              width={16}
              height={16}
            />
          )}
        </Pressable>
      )}
    </View>
  )
}
