import { useBottomTabBarHeight as useRNTabBarHeight } from 'react-native-bottom-tabs'

// This hook throws an error if it's not under a Tab Navigator
// Use this hook instead of importing react-native-bottom-tabs directly
// In case there is no Tab Navigator, then tab bar has no height
export function useBottomTabBarHeight(): number {
  try {
    return useRNTabBarHeight()
  } catch (e) {
    return 0
  }
}
