import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { goBackward, goForward } from './slices/tabs'
import { historyAdapter, tabAdapter } from './utils'

const updateActiveHistory = (
  _: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const { getState } = listenerApi
  const globalHistoryState = getState().browser.globalHistory
  const tabsState = getState().browser.tabs
  const activeTabId = tabsState.activeTabId
  if (activeTabId === undefined) return

  const historyId = tabAdapter.getSelectors().selectById(tabsState, activeTabId)
    ?.activeHistory?.id

  if (!historyId) return

  const history = historyAdapter
    .getSelectors()
    .selectById(globalHistoryState, historyId)

  tabAdapter.updateOne(tabsState, {
    id: activeTabId,
    changes: {
      activeHistory: history
    }
  })
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })
}
