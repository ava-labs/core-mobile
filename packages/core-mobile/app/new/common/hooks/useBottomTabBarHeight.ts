import { useBottomTabBarHeight as useRNTabBarHeight } from 'react-native-bottom-tabs'

export function useBottomTabBarHeight(fallback = 0): number {
  try {
    return useRNTabBarHeight()
  } catch (e) {
    return fallback
  }
}
