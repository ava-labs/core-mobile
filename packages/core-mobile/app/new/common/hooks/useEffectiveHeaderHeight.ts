import { useHeaderHeight } from '@react-navigation/elements'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * `useHeaderHeight` is backed by an internal context value set by React Navigation.
 * After some dependency upgrades, Android can sometimes report `0` due to native
 * header height events being delivered out-of-order.
 *
 * For screens that rely on a transparent native header overlaying content, a `0`
 * value causes layout bugs. This hook provides a safe fallback on Android.
 */
export function useEffectiveHeaderHeight(): number {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()

  // React Navigation's default Material-like header height on Android (without inset)
  const ANDROID_HEADER_HEIGHT = 56

  if (Platform.OS === 'android' && headerHeight === 0) {
    return ANDROID_HEADER_HEIGHT + insets.top
  }

  return headerHeight
}
