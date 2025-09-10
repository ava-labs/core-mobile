import React, { useEffect, useState } from 'react'
import { ViewStyle, View, Platform } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'

export const PageControl = ({
  numberOfPage,
  currentPage,
  style
}: {
  numberOfPage: number
  currentPage: number
  style?: ViewStyle
}): JSX.Element => {
  const translationAnimation = useSharedValue(0)
  const viewPortWidth =
    (Configuration.dot.width + Configuration.gap) *
      (Configuration.maxDotsInViewPort - 1) +
    Configuration.dot.selectedWidth
  const [translatedX, setTranslatedX] = useState(0)

  useEffect(() => {
    const currentOffset =
      currentPage * (Configuration.dot.width + Configuration.gap)
    const shouldTranslateLeft =
      currentOffset + Configuration.dot.selectedWidth >
      viewPortWidth - translatedX
    const shouldTranslateRight = currentOffset < -translatedX
    const targetTranslation = shouldTranslateLeft
      ? translatedX - Configuration.dot.width - Configuration.gap
      : shouldTranslateRight
      ? translatedX + Configuration.dot.width + Configuration.gap
      : translatedX

    translationAnimation.value =
      shouldTranslateLeft || shouldTranslateRight
        ? withTiming(
            targetTranslation,
            { duration: Configuration.translationAnimation.duration },
            () => {
              runOnJS(setTranslatedX)(targetTranslation)
            }
          )
        : targetTranslation
  }, [currentPage, translationAnimation, viewPortWidth, translatedX])

  return (
    <View
      style={[
        {
          padding: 0,
          overflow: 'hidden',
          alignItems: 'center',
          flex: 1,
          height: '100%',
          marginRight: Platform.OS === 'ios' ? 64 : 0
        },
        style
      ]}>
      <View
        style={[
          {
            gap: Configuration.gap,
            flexDirection: 'row'
          }
        ]}>
        {Array.from({ length: numberOfPage }).map((_, index) => {
          return <AnimatedDot key={index} selected={index === currentPage} />
        })}
      </View>
    </View>
  )
}

const AnimatedDot = ({ selected }: { selected: boolean }): JSX.Element => {
  const { theme } = useTheme()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withDelay(
        Configuration.dot.animation.delay,
        withTiming(
          selected ? Configuration.dot.selectedWidth : Configuration.dot.width,
          { duration: Configuration.dot.animation.duration }
        )
      ),
      opacity: withTiming(selected ? 1 : 0.4, {
        duration: Configuration.dot.animation.duration
      })
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: Configuration.dot.width,
          height: Configuration.dot.height,
          borderRadius: 8,
          backgroundColor: theme.colors.$textPrimary
        },
        animatedStyle
      ]}
    />
  )
}

const Configuration = {
  gap: 5,
  dot: {
    width: 7,
    height: 7,
    selectedWidth: 17,
    animation: {
      delay: 0,
      duration: 300
    }
  },
  maxDotsInViewPort: 5,
  translationAnimation: {
    duration: 200
  }
}
