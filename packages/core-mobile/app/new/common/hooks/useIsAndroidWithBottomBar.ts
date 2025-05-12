import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useIsAndroidWithBottomBar(): boolean {
  const insets = useSafeAreaInsets()
  if (Platform.OS !== 'android') {
    return false
  }
  return insets.bottom > 24
}
