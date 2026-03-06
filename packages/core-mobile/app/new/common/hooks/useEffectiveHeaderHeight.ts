import { useHeaderHeight } from '@react-navigation/elements'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ANDROID_DEFAULT_HEADER_HEIGHT = 56

/**
 * `useHeaderHeight` is backed by an internal context value set by React Navigation.
 * After some dependency upgrades, Android can report incorrect values for screens
 * inside nested stacks (e.g. Stack inside native BottomTabs).
 *
 * react-native-screens 4.22+ changed nested stacks to use childFragmentManager,
 * which can cause the reported header height to be 0 or just the status bar inset
 * instead of the full header height (toolbar + inset).
 *
 * For screens that rely on a transparent native header overlaying content,
 * an incorrect value causes layout bugs. This hook provides a safe fallback.
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
  if (platform === 'android' && headerHeight <= insetTop) {
    return ANDROID_DEFAULT_HEADER_HEIGHT + insetTop
  }
  return headerHeight
}
