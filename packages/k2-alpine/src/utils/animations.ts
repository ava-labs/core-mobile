import { Easing } from 'react-native-reanimated'

export const SCALE = 0.96
export const EASING = Easing.bezier(0.25, 1, 0.5, 1) // EaseOutQuart
export const DURATION = 500

export const SPRING_CONFIG = {
  damping: 10,
  stiffness: 200,
  mass: 0.5
}
export const TIMING_CONFIG = {
  duration: DURATION,
  easing: EASING
}

export const ANIMATED = {
  DURATION,
  EASING,
  SPRING_CONFIG,
  TIMING_CONFIG,
  SCALE
}
