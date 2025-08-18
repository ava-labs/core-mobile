import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { toggleDeveloperMode } from 'store/settings/advanced'
import { isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import BridgeService from 'services/bridge/BridgeService'
import { uuid } from 'utils/uuid'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import { setConfig } from './slice'

const CONFIG_FETCH_INTERVAL = 15000

const fetchConfigPeriodically = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { fork, dispatch, cancelActiveListeners, condition } = listenerApi

  // cancel any in-progress instances of this listener
  cancelActiveListeners()

  const pollingTask = fork(async forkApi => {
    const taskId = uuid().slice(0, 8)

    Logger.info(`started task ${taskId}`, 'fetch bridge config periodically')

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // cancellation-aware wait for the fetch to be done
        const config = await runAfterInteractions(async () => {
          return forkApi.pause(BridgeService.getConfig())
        })

        config && dispatch(setConfig(config))

        // cancellation-aware delay
        await forkApi.delay(CONFIG_FETCH_INTERVAL)
      }
    } catch (err) {
      if (err instanceof TaskAbortError) {
        // task got cancelled or the listener got cancelled
        Logger.info(`stopped task ${taskId}`)
      } else {
        Logger.error('failed to fetch bridge config', err)
      }
    }
  })

  await condition(isAnyOf(onAppLocked, onLogOut))
  pollingTask.cancel()
}

export const addBridgeListeners = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: fetchConfigPeriodically
  })
}
