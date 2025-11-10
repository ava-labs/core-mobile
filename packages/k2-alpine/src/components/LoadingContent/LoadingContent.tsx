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
}

export const LoadingContent = ({
  isLoading,
  children
}: LoadingContentProps): JSX.Element => {
  const { theme } = useTheme()
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    if (isLoading) {
      opacity.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true)
    } else {
      opacity.value = withTiming(1, { duration: 500 })
    }
  }, [isLoading, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      paddingLeft: withTiming(isLoading ? 28 : 0, { duration: 300 })
    }
  })

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isLoading ? 20 : 0, { duration: 300 }),
      opacity: withTiming(isLoading ? 1 : 0, { duration: 300 })
    }
  })

  return (
    <View
      style={{
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <Animated.View
        style={[
          { position: 'absolute', left: 0, justifyContent: 'center' },
          indicatorStyle
        ]}>
        <ActivityIndicator size="small" color={theme.colors.$textPrimary} />
      </Animated.View>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </View>
  )
}
