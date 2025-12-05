import { ActivityIndicator, View } from 'dripsy'
import React, { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'

interface LoadingContentProps {
  isLoading?: boolean
  children: React.ReactNode
  hideSpinner?: boolean
  minOpacity?: number
  maxOpacity?: number
}

export const LoadingContent = ({
  isLoading,
  children,
  hideSpinner = false,
  minOpacity = 0.3,
  maxOpacity = 0.5
}: LoadingContentProps): JSX.Element => {
  const { theme } = useTheme()

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isLoading && !hideSpinner ? 20 : 0, { duration: 300 }),
      opacity: withTiming(isLoading && !hideSpinner ? 1 : 0, { duration: 300 })
    }
  })

  return (
    <View
      style={{
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      {!hideSpinner && (
        <Animated.View
          style={[
            { position: 'absolute', left: 0, justifyContent: 'center' },
            indicatorStyle
          ]}>
          <ActivityIndicator size="small" color={theme.colors.$textPrimary} />
        </Animated.View>
      )}

      <LoadingFadeInOut
        minOpacity={minOpacity}
        maxOpacity={maxOpacity}
        isLoading={isLoading ?? false}>
        {children}
      </LoadingFadeInOut>
    </View>
  )
}

export const LoadingFadeInOut = ({
  isLoading,
  minOpacity = 0.3,
  maxOpacity = 0.5,
  children
}: {
  isLoading: boolean
  minOpacity?: number
  maxOpacity?: number
  children: React.ReactNode
}): JSX.Element => {
  const opacity = useSharedValue(maxOpacity)

  useEffect(() => {
    if (isLoading) {
      opacity.value = withRepeat(
        withTiming(minOpacity, { duration: 800 }),
        -1,
        true
      )
    } else {
      opacity.value = withTiming(1, { duration: 500 })
    }
  }, [isLoading, maxOpacity, minOpacity, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      paddingLeft: withTiming(isLoading ? 28 : 0, { duration: 300 })
    }
  })

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
