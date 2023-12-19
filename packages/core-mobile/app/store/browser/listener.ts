import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import {
  goBackward,
  goForward,
  selectActiveTab,
  setActiveHistoryForTab
} from './slices/tabs'

const updateActiveHistory = (
  action: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const browserAction = isAnyOf(goBackward)(action) ? 'backward' : 'forward'

  const state = listenerApi.getState()
  const activeTab = selectActiveTab(state)
  if (!activeTab) return
  const activeHistoryIndex = activeTab.activeHistoryIndex
  if (activeHistoryIndex === -1) return
  const newActiveHistoryIndex =
    browserAction === 'forward'
      ? activeHistoryIndex + 1
      : activeHistoryIndex - 1

  listenerApi.dispatch(
    setActiveHistoryForTab({
      id: activeTab.id,
      activeHistoryIndex: newActiveHistoryIndex
    })
  )
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })
}
