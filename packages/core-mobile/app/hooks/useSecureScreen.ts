import { useEffect } from 'react'
import { NativeModules, Platform } from 'react-native'

/**
 * Enables FLAG_SECURE (Android) while the screen is mounted, then clears it on unmount.
 * Requires MainPackage to be registered in MainApplication.kt.
 */
export function useSecureScreen(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return
    NativeModules.SecureActivity?.onCreate()
    return () => {
      NativeModules.SecureActivity?.onDestroy()
    }
  }, [])
}
