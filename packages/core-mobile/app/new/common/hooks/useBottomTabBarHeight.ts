import { TAB_BAR_HEIGHT } from 'common/consts/screenOptions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useBottomTabBarHeight(): number {
  const insets = useSafeAreaInsets()
  try {
    return TAB_BAR_HEIGHT + insets.bottom
  } catch (e) {
    return 0
  }
}
