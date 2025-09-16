import { useCallback } from 'react'
import { Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'
import { selectIsInAppUpdateAndroidBlocked } from 'store/posthog'

export const useUpdateApp = (): (() => void) => {
  const isInAppUpdateAndroidBlocked = useSelector(
    selectIsInAppUpdateAndroidBlocked
  )

  return useCallback(() => {
    if (Platform.OS === 'ios') {
      AppUpdateService.goToAppStore()
    } else if (Platform.OS === 'android') {
      if (isInAppUpdateAndroidBlocked) {
        AppUpdateService.goToPlayStore()
      } else {
        AppUpdateService.performAndroidInAppUpdate()
      }
    }
  }, [isInAppUpdateAndroidBlocked])
}
