import React, { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'

export const Arrow = ({ expanded }: { expanded: boolean }): JSX.Element => {
  const { theme } = useTheme()
  const rotation = useSharedValue(expanded ? 1 : 0)

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 300 })
  }, [expanded, rotation])

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = `${rotation.value * 180 + 90}deg`
    return {
      transform: [{ rotate }]
    }
  })

  return (
    <Animated.View style={[{ marginRight: -6 }, animatedStyle]}>
      <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
    </Animated.View>
  )
}
