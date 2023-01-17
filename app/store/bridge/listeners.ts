import { v4 as uuidv4 } from 'uuid'
import { AppListenerEffectAPI } from 'store'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { selectActiveNetwork } from 'store/network'
import { toggleDeveloperMode } from 'store/settings/advanced'
import { isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import BridgeService from 'services/bridge/BridgeService'
import { setConfig } from './slice'

const CONFIG_FETCH_INTERVAL = 15000

const fetchConfigPeriodically = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const { fork, dispatch, getState, cancelActiveListeners, condition } =
    listenerApi

  // cancel any in-progress instances of this listener
  cancelActiveListeners()

  const pollingTask = fork(async forkApi => {
    const taskId = uuidv4().slice(0, 8)

    Logger.info(`started task ${taskId}`, 'fetch bridge config periodically')

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const state = getState()

        const activeNetwork = selectActiveNetwork(state)

        // cancellation-aware wait for the fetch to be done
        const config = await forkApi.pause(
          BridgeService.getConfig(activeNetwork)
        )

        dispatch(setConfig(config))

        // cancellation-aware delay
        await forkApi.delay(CONFIG_FETCH_INTERVAL)
      }
    } catch (err) {
      Logger.error('failed to fetch bridge config', err)

      if (err instanceof TaskAbortError) {
        // task got cancelled or the listener got cancelled
        Logger.info(`stopped task ${taskId}`)
      }
    }
  })

  await condition(isAnyOf(onAppLocked, onLogOut))
  pollingTask.cancel()
}

export const addBridgeListeners = (startListening: AppStartListening) => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: fetchConfigPeriodically
  })
}
