import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { usePromptSolanaLaunchScreenIfNeeded } from './usePromptSolanaLaunchScreenIfNeeded'
import { usePromptEnableNotificationsIfNeeded } from './usePromptEnableNotificationsIfNeeded'
import { usePromptUpdateAppScreenIfNeeded } from './usePromptUpdateAppScreenIfNeeded'

export const usePerformAfterLoginFlows = (): (() => Promise<void>) => {
  const promptUpdateAppScreenIfNeeded = usePromptUpdateAppScreenIfNeeded()
  const promptSolanaLaunchModalIfNeeded = usePromptSolanaLaunchScreenIfNeeded()
  const promptEnableNotificationsIfNeeded =
    usePromptEnableNotificationsIfNeeded()

  return useCallback(async () => {
    InteractionManager.runAfterInteractions(async () => {
      await promptUpdateAppScreenIfNeeded()
      await promptEnableNotificationsIfNeeded()
      await promptSolanaLaunchModalIfNeeded()
    })
  }, [
    promptEnableNotificationsIfNeeded,
    promptSolanaLaunchModalIfNeeded,
    promptUpdateAppScreenIfNeeded
  ])
}
