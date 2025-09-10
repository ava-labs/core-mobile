import { useCallback } from 'react'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'
import { waitForInteractions } from 'common/utils/waitForInteractions'

export const usePromptAppUpdateScreenIfNeeded = (): (() => Promise<void>) => {
  return useCallback(async () => {
    const appUpdateStatus = await AppUpdateService.checkAppUpdateStatus()

    if (!appUpdateStatus) return

    const hasBeenViewedAppUpdateScreen =
      AppUpdateService.hasSeenAppUpdateScreen(appUpdateStatus.version)
    const shouldShowAppUpdateScreen =
      hasBeenViewedAppUpdateScreen === false &&
      appUpdateStatus.needsUpdate === true
    if (shouldShowAppUpdateScreen) {
      await waitForInteractions()

      await navigateWithPromise({
        pathname: '/(signedIn)/(modals)/appUpdate',
        params: {
          appVersion: appUpdateStatus.version
        }
      })
    }
  }, [])
}
