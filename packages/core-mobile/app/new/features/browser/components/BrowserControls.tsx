import { alpha, ANIMATED, useTheme, View } from '@avalabs/k2-alpine'
import { BlurView } from 'expo-blur'
import React, { ReactNode, useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { BrowserInput } from './BrowserInput'
import { FavoritesList } from './FavoritesList'
import { HistoryList } from './HistoryList'

export const BrowserControls = (): ReactNode => {
  const { theme } = useTheme()
  const { urlEntry } = useBrowserContext()

  const [isFocused, setIsFocused] = useState(false)

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, ANIMATED.TIMING_CONFIG)
    }
  })

  const topContentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(urlEntry?.length ? 0 : 1, ANIMATED.TIMING_CONFIG),
      transform: [
        {
          scale: withTiming(isFocused ? 1 : 0.9, ANIMATED.TIMING_CONFIG)
        }
      ]
    }
  })
  const bottomContentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(urlEntry?.length ? 1 : 0, ANIMATED.TIMING_CONFIG),
      transform: [
        {
          scale: withTiming(isFocused ? 1 : 0.9, ANIMATED.TIMING_CONFIG)
        }
      ]
    }
  })

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(72, ANIMATED.TIMING_CONFIG)
    }
  })

  return (
    <>
      <Animated.View
        style={[
          wrapperStyle,
          {
            backgroundColor: alpha(theme.colors.$surfacePrimary, 0.6),
            bottom: -1,
            position: 'absolute',
            left: 0,
            right: 0
          }
        ]}>
        <BlurView
          intensity={50}
          tint={theme.isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={{
            padding: HORIZONTAL_MARGIN,
            zIndex: 10
          }}>
          <BrowserInput isFocused={isFocused} setIsFocused={setIsFocused} />
        </BlurView>
      </Animated.View>

      <Animated.View
        pointerEvents={isFocused ? 'auto' : 'none'}
        style={[
          contentStyle,
          {
            flex: 1,
            position: 'absolute',
            top: 0,
            bottom: 71,
            left: 0,
            right: 0,
            backgroundColor: alpha(theme.colors.$surfacePrimary, 0.6)
          }
        ]}>
        <View
          style={[
            {
              flex: 1
            }
          ]}>
          <KeyboardAvoidingView
            style={{
              flex: 1
            }}>
            <BlurView
              intensity={50}
              tint={theme.isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={{
                flex: 1
              }}>
              <Animated.View
                pointerEvents={urlEntry.length ? 'none' : 'auto'}
                style={[
                  topContentStyle,
                  {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    flex: 1,
                    zIndex: urlEntry.length ? -1 : 1
                  }
                ]}>
                <FavoritesList />
              </Animated.View>
              <Animated.View
                pointerEvents={urlEntry.length ? 'auto' : 'none'}
                style={[
                  bottomContentStyle,
                  {
                    flex: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: urlEntry.length ? 1 : -1
                  }
                ]}>
                <HistoryList />
              </Animated.View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </>
  )
}
