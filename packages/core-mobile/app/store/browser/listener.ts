import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { historyAdapter } from 'store/browser/utils'
import { History } from 'store/browser/types'
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
  const newActiveHistoryIndex =
    browserAction === 'forward'
      ? activeHistoryIndex + 1
      : activeHistoryIndex - 1
  if (newActiveHistoryIndex === -2) return

  const historyId = activeTab?.historyIds[newActiveHistoryIndex]
  if (newActiveHistoryIndex !== -1 && !historyId) return
  let history: History | undefined
  if (historyId) {
    history = historyAdapter
      .getSelectors()
      .selectById(state.browser.globalHistory, historyId)
  }

  listenerApi.dispatch(
    setActiveHistoryForTab({
      id: activeTab.id,
      activeHistoryIndex: newActiveHistoryIndex,
      activeHistory: history
    })
  )
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })
}
