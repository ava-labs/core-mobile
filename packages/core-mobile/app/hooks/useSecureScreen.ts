import { useEffect } from 'react'
import { NativeModules, Platform } from 'react-native'

/** Sets FLAG_SECURE on Android while mounted; needs MainPackage registered. */
export function useSecureScreen(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return
    NativeModules.SecureActivity?.onCreate()
    return () => {
      NativeModules.SecureActivity?.onDestroy()
    }
  }, [])
}
