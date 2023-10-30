import { createEntityAdapter } from '@reduxjs/toolkit'
import { getUnixTime } from 'date-fns'
import Logger from 'utils/Logger'
import { MAXIMUM_TABS } from './const'
import { Tab, BrowserState, History, TabId, TabState, HistoryId } from './types'

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

export const limitMaxTabs = (state: BrowserState): void => {
  const tabIds = tabAdapter.getSelectors().selectIds(state.tabs)
  if (tabIds.length > MAXIMUM_TABS) {
    const numberOfTabsToRemove = tabIds.length - MAXIMUM_TABS
    const oldestTabIds = getOldestTabIds(state, numberOfTabsToRemove)
    if (oldestTabIds === undefined) return
    tabAdapter.removeMany(state.tabs, oldestTabIds)
  }
}

export const updateActiveTabId = (state: BrowserState, tabId: TabId): void => {
  if (state.tabs.ids.length === 0) {
    state.tabs.activeTabId = undefined
    return
  }
  if (state.tabs.activeTabId === tabId) {
    const lastVisitedTabId = getLastVisitedTabId(state)
    if (!lastVisitedTabId) {
      state.tabs.activeTabId = undefined
      Logger.warn('could not find last visited tab id')
      return
    }
    state.tabs.activeTabId = lastVisitedTabId
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

const getLastVisitedTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tabs)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab?.id
}

const getOldestTabIds = (
  state: BrowserState,
  count: number
): TabId[] | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tabs)
  if (tabs.length === 0) return undefined
  const oldestTabs = getOldestTab(tabs, count)
  return oldestTabs.map(tab => tab.id)
}

const getLastVisitedTabHistoryId = (state: TabState): TabId | undefined => {
  return tabAdapter.getSelectors().selectById(state, state.activeTabId ?? '')
    ?.historyIds[-1]
}

export const navigateTabHistory = (
  state: BrowserState,
  action: 'forward' | 'backward',
  tabId: TabId
): void => {
  const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)
  if (tab === undefined) return
  const activeHistoryId = state.tabs.activeHistoryId
  if (activeHistoryId === undefined) return

  const activeHistoryIndex = tab.historyIds.indexOf(activeHistoryId)
  if (activeHistoryIndex === undefined) return
  const newActiveHistoryIndex =
    action === 'forward' ? activeHistoryIndex + 1 : activeHistoryIndex - 1
  const historyId = tab.historyIds[newActiveHistoryIndex]
  if (historyId === undefined) return
  state.tabs.activeHistoryId = historyId.toString()
  tabAdapter.updateOne(state.tabs, {
    id: tabId,
    changes: {
      lastVisited: getUnixTime(new Date())
    }
  })
}
