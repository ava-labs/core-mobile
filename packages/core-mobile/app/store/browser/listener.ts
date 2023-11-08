import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { goBackward, goForward, setActiveHistoryForTab } from './slices/tabs'
import { historyAdapter, tabAdapter } from './utils'

const updateActiveHistory = (
  action: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const browserAction = isAnyOf(goBackward)(action) ? 'backward' : 'forward'

  const { getState, dispatch } = listenerApi
  const globalHistoryState = getState().browser.globalHistory
  const tabState = getState().browser.tabs
  const activeTabId = tabState.activeTabId
  if (activeTabId === undefined) return

  const historyId = tabAdapter.getSelectors().selectById(tabState, activeTabId)
    ?.activeHistory?.id

  if (!historyId) return
  const tab = tabAdapter.getSelectors().selectById(tabState, activeTabId)
  if (tab === undefined || tab.activeHistory?.id === undefined) return

  const activeHistoryIndex = tab.historyIds.indexOf(tab.activeHistory.id)

  if (activeHistoryIndex === -1) return
  const newActiveHistoryIndex =
    browserAction === 'forward'
      ? activeHistoryIndex + 1
      : activeHistoryIndex - 1

  const newActiveHistoryId = tab.historyIds[newActiveHistoryIndex]

  if (newActiveHistoryId === undefined) return

  const newActiveHistory = historyAdapter
    .getSelectors()
    .selectById(globalHistoryState, newActiveHistoryId)

  dispatch(
    setActiveHistoryForTab({ id: activeTabId, activeHistory: newActiveHistory })
  )
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })
}
