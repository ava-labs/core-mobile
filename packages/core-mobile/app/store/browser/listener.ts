import { AppListenerEffectAPI } from 'store'
import { AppStartListening } from 'store/middleware/listener'
import { Action, isAnyOf } from '@reduxjs/toolkit'
import { historyAdapter, tabAdapter } from 'store/browser/utils'
import {
  removeAllHistories,
  removeHistory
} from 'store/browser/slices/globalHistory'
import { HistoryId } from 'store/browser/types'
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

  const historyId = activeTab?.historyIds[newActiveHistoryIndex]
  if (!historyId) return
  const history = historyAdapter
    .getSelectors()
    .selectById(state.browser.globalHistory, historyId)
  if (!history) return

  listenerApi.dispatch(
    setActiveHistoryForTab({
      id: activeTab.id,
      activeHistoryIndex: newActiveHistoryIndex,
      activeHistory: history
    })
  )
}
const handleRemoveAllHistories = (
  _: Action,
  listenerApi: AppListenerEffectAPI
): void => {
  const state = listenerApi.getState()
  historyAdapter.removeAll(state.browser.globalHistory)
  const tabsState = state.browser.tabs
  const allTabs = tabAdapter.getSelectors().selectAll(tabsState)
  allTabs.forEach(tab => {
    tabAdapter.updateOne(tabsState, {
      id: tab.id,
      changes: {
        historyIds: [],
        activeHistoryIndex: -1
      }
    })
  })
}
const handleRemoveHistory = (
  historyId: HistoryId,
  listenerApi: AppListenerEffectAPI
): void => {
  const state = listenerApi.getState()
  historyAdapter.removeOne(state.browser.globalHistory, historyId)

  //remove that history item from all tabs
  const tabsState = state.browser.tabs
  const allTabs = tabAdapter.getSelectors().selectAll(tabsState)
  allTabs.forEach(tab => {
    let historyIds = tab.historyIds.filter(id => id !== historyId)
    const activeHistoryIndex = historyIds.indexOf(
      tab.activeHistory?.id ?? 'undefined'
    )
    if (activeHistoryIndex === -1) {
      //we removed history which is currently active on this tab; let's remove all history items for that tab
      historyIds = []
    }
    tabAdapter.updateOne(tabsState, {
      id: tab.id,
      changes: {
        historyIds,
        activeHistoryIndex
      }
    })
  })
}

export const addBrowserListener = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(goBackward, goForward),
    effect: updateActiveHistory
  })
  startListening({
    actionCreator: removeAllHistories,
    effect: handleRemoveAllHistories
  })
  startListening({
    actionCreator: removeHistory,
    effect: (action, listenerApi) => {
      handleRemoveHistory(action.payload.historyId, listenerApi)
    }
  })
}
