import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { noop } from '@avalabs/core-utils-sdk/dist'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'

export const usePromptUpdateAppScreenIfNeeded = (): (() => Promise<void>) => {
  return useCallback(async () => {
    const appUpdateStatus = await AppUpdateService.checkAppUpdateStatus()

    if (!appUpdateStatus) return

    const hasBeenViewedUpdateAppScreen =
      AppUpdateService.hasSeenUpdateAppScreen(appUpdateStatus.storeVersion)
    const shouldShowUpdateAppScreen =
      hasBeenViewedUpdateAppScreen === false &&
      appUpdateStatus.shouldUpdate === true
    if (shouldShowUpdateAppScreen) {
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions(() => {
          navigateWithPromise({
            pathname: '/(signedIn)/(modals)/updateApp',
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
