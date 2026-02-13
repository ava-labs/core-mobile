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
  return computeEffectiveHeaderHeight(Platform.OS, headerHeight, insets.top)
}

export function computeEffectiveHeaderHeight(
  platform: string,
  headerHeight: number,
  insetTop: number
): number {
  // React Navigation's default Material-like header height on Android (without inset)
  if (platform === 'android' && headerHeight === 0) {
    return 56 + insetTop
  }
  return headerHeight
}
