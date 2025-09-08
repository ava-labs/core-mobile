import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { noop } from '@avalabs/core-utils-sdk/dist'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'

export const usePromptAppUpdateScreenIfNeeded = (): (() => Promise<void>) => {
  return useCallback(async () => {
    const appUpdateStatus = await AppUpdateService.checkAppUpdateStatus()

    if (!appUpdateStatus) return

    const hasBeenViewedAppUpdateScreen =
      AppUpdateService.hasSeenAppUpdateScreen(appUpdateStatus.storeVersion)
    const shouldShowAppUpdateScreen =
      hasBeenViewedAppUpdateScreen === false &&
      appUpdateStatus.shouldUpdate === true
    if (shouldShowAppUpdateScreen) {
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions(() => {
          navigateWithPromise({
            pathname: '/(signedIn)/(modals)/appUpdate',
            params: {
              storeVersion: appUpdateStatus.storeVersion
            }
          })
            .then(resolve)
            .catch(noop)
        })
      })
    }
  }, [])
}
