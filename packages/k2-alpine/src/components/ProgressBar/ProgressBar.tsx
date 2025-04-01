import MaskedView from '@react-native-masked-view/masked-view'
import React, { ReactNode, useLayoutEffect, useRef } from 'react'
import { View } from 'react-native'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { ANIMATED } from '../../utils'

export const ProgressBar = ({
  progress,
  children
}: {
  progress: SharedValue<number>
  children: ReactNode
}): ReactNode => {
  const { theme } = useTheme()
  const inputWidth = useRef(0)
  const opacity = useSharedValue(1)

  const contentRef = useRef<View>(null)

  useLayoutEffect(() => {
    contentRef.current?.measureInWindow((x, y, width) => {
      if (width) {
        inputWidth.current = width
      }
    })
  }, [])

  const endProgress = (): void => {
    if (progress.value === 1) {
      opacity.value = withTiming(
        0,
        { ...ANIMATED.TIMING_CONFIG, duration: 1000 },
        () => {
          progress.value = 0
        }
      )
    } else {
      opacity.value = 1
    }
  }

  const progressStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      width: withTiming(
        inputWidth.current * progress.value,
        ANIMATED.TIMING_CONFIG,
        () => {
          runOnJS(endProgress)()
        }
      )
    }
  })

  return (
    <>
      <View
        ref={contentRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%'
        }}>
        <Animated.View
          style={[
            progressStyle,
            {
              height: '100%',
              backgroundColor: theme.colors.$textPrimary
            }
          ]}
        />
      </View>
      {children}
    </>
  )
}

export const MaskedProgressBar = ({
  progress,
  children
}: {
  progress: SharedValue<number>
  children: ReactNode
}): ReactNode => {
  const inputWidth = useRef(0)
  const opacity = useSharedValue(1)

  const contentRef = useRef<View>(null)

  useLayoutEffect(() => {
    contentRef.current?.measureInWindow((x, y, width) => {
      if (width) {
        inputWidth.current = width
      }
    })
  }, [])

  const endProgress = (): void => {
    if (progress.value === 1) {
      opacity.value = withTiming(
        0,
        { ...ANIMATED.TIMING_CONFIG, duration: 1000 },
        () => {
          progress.value = 0
        }
      )
    } else {
      opacity.value = 1
    }
  }

  const progressStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      width: withTiming(
        inputWidth.current * progress.value,
        ANIMATED.TIMING_CONFIG,
        () => {
          runOnJS(endProgress)()
        }
      )
    }
  })

  return (
    <View
      style={{
        flex: 1
      }}>
      {children}

      <MaskedView
        style={{
          flex: 1
        }}
        maskElement={
          <View
            style={{
              height: '100%',
              backgroundColor: 'transparent'
            }}>
            <Animated.View
              style={[
                {
                  backgroundColor: 'green',
                  height: '100%'
                },
                progressStyle
              ]}
            />
          </View>
        }>
        {children}
      </MaskedView>
    </View>
  )
}
