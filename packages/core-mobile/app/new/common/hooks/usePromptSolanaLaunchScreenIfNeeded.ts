import { useCallback } from 'react'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { useSelector } from 'react-redux'
import { waitForInteractions } from 'common/utils/waitForInteractions'

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
        await waitForInteractions()

        await navigateWithPromise({
          pathname: '/(signedIn)/(modals)/solanaLaunch'
        })
      }
    }, [hasBeenViewedSolanaLaunch, isSolanaSupportBlocked])
  }
