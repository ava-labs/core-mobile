import { useCallback } from 'react'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { InteractionManager } from 'react-native'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { noop } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'

export const usePromptSolanaLaunchScreenIfNeeded =
  (): (() => Promise<void>) => {
    const hasBeenViewedSolanaLaunch = useSelector(
      selectHasBeenViewedOnce(ViewOnceKey.SOLANA_LAUNCH)
    )
    const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

    return useCallback(async () => {
      const shouldShowSolanaLaunchModal =
        !hasBeenViewedSolanaLaunch && !isSolanaSupportBlocked
      if (shouldShowSolanaLaunchModal) {
        await new Promise<void>(resolve => {
          InteractionManager.runAfterInteractions(() => {
            navigateWithPromise({
              pathname: '/(signedIn)/(modals)/solanaLaunch'
            })
              .then(resolve)
              .catch(noop)
          })
        })
      }
    }, [hasBeenViewedSolanaLaunch, isSolanaSupportBlocked])
  }
