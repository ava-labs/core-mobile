import { createEntityAdapter } from '@reduxjs/toolkit'
import { getUnixTime } from 'date-fns'
import Logger from 'utils/Logger'
import { MAXIMUM_TABS } from './const'
import { Tab, History, TabId, HistoryId, Favorite, TabState } from './types'

export const getOldestTab = (tabs: Tab[], count: number): Tab[] => {
  return tabs
    .sort((a, b) => (a.lastVisited ?? 0) - (b.lastVisited ?? 0))
    .slice(0, count - 1)
}

export const getLatestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))[0]
}

export const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
export const historyAdapter = createEntityAdapter<History>({
  selectId: history => history.id
})
export const favoriteAdapter = createEntityAdapter<Favorite>({
  selectId: favorite => favorite.id
})

export const limitMaxTabs = (state: TabState): void => {
  const tabs = tabAdapter.getSelectors().selectAll(state)
  if (tabs.length <= MAXIMUM_TABS) return
  tabAdapter.removeMany(state, getTabsToDelete(tabs))
}

const getTabsToDelete = (tabs: Tab[]): TabId[] => {
  return tabs
    .sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0)) //sort by last visited first
    .slice(MAXIMUM_TABS) //get least visited above limit
    .map(tab => tab.id)
}

export const updateActiveTabId = (state: TabState, tabId: TabId): void => {
  if (state.ids.length === 0) {
    state.activeTabId = undefined
    return
  }
  if (state.activeTabId === tabId) {
    const lastVisitedTabId = getLastVisitedTabId(state)
    if (!lastVisitedTabId) {
      state.activeTabId = undefined
      Logger.warn('could not find last visited tab id')
      return
    }
    state.activeTabId = lastVisitedTabId
  }
}

export const updateActiveTabHistoryId = (
  tabState: TabState,
  tabId: TabId,
  historyId: HistoryId
): void => {
  if (tabState.activeHistoryId === historyId) {
    const lastVisitedHistoryId = getLastVisitedTabHistoryId(tabState)
    if (!lastVisitedHistoryId) {
      tabState.activeHistoryId = undefined
      Logger.warn('could not find last visited history id')
      return
    }
    tabState.activeHistoryId = historyId
    tabAdapter.updateOne(tabState, {
      id: tabId,
      changes: {
        lastVisited: getUnixTime(new Date())
      }
    })
  }
}

const getLastVisitedTabId = (state: TabState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab?.id
}

const getLastVisitedTabHistoryId = (state: TabState): TabId | undefined => {
  return tabAdapter.getSelectors().selectById(state, state.activeTabId ?? '')
    ?.historyIds[-1]
}

export const navigateTabHistory = (
  state: TabState,
  action: 'forward' | 'backward',
  tabId: TabId
): void => {
  const tab = tabAdapter.getSelectors().selectById(state, tabId)
  if (tab === undefined) return
  const activeHistoryId = state.activeHistoryId
  if (activeHistoryId === undefined) return

  const activeHistoryIndex = tab.historyIds.indexOf(activeHistoryId)
  if (activeHistoryIndex === -1) return
  const newActiveHistoryIndex =
    action === 'forward' ? activeHistoryIndex + 1 : activeHistoryIndex - 1
  const historyId = tab.historyIds[newActiveHistoryIndex]
  if (historyId === undefined) return
  state.activeHistoryId = historyId.toString()
  tabAdapter.updateOne(state, {
    id: tabId,
    changes: {
      lastVisited: getUnixTime(new Date())
    }
  })
}
