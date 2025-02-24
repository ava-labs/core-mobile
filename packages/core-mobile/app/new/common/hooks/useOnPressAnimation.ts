import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring
} from 'react-native-reanimated'

export const useOnPressAnimation = (): {
  handleOnPressAnimation: () => void
  animatedStyle: {
    transform: {
      scale: number
    }[]
  }
} => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    }
  })

  const handleOnPressAnimation = (): void => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 10, stiffness: 500 })
    )
  }

  return { handleOnPressAnimation, animatedStyle }
}
