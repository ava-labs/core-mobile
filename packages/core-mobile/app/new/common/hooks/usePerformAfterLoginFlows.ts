import { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { usePromptSolanaLaunchScreenIfNeeded } from './usePromptSolanaLaunchScreenIfNeeded'
import { usePromptEnableNotificationsIfNeeded } from './usePromptEnableNotificationsIfNeeded'
import { usePromptAppUpdateScreenIfNeeded } from './usePromptAppUpdateScreenIfNeeded'

export const usePerformAfterLoginFlows = (): (() => Promise<void>) => {
  const promptAppUpdateScreenIfNeeded = usePromptAppUpdateScreenIfNeeded()
  const promptSolanaLaunchModalIfNeeded = usePromptSolanaLaunchScreenIfNeeded()
  const promptEnableNotificationsIfNeeded =
    usePromptEnableNotificationsIfNeeded()

  return useCallback(async () => {
    InteractionManager.runAfterInteractions(async () => {
      await promptAppUpdateScreenIfNeeded()
      await promptEnableNotificationsIfNeeded()
      await promptSolanaLaunchModalIfNeeded()
    })
  }, [
    promptEnableNotificationsIfNeeded,
    promptSolanaLaunchModalIfNeeded,
    promptAppUpdateScreenIfNeeded
  ])
}
