import { createEntityAdapter } from '@reduxjs/toolkit'
import { getUnixTime } from 'date-fns'
import Logger from 'utils/Logger'
import { MAXIMUM_TABS } from './const'
import { Tab, BrowserState, History, TabId, HistoryId } from './types'

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
  const tabs = tabAdapter.getSelectors().selectAll(state.tabs)
  if (tabs.length <= MAXIMUM_TABS) return
  tabAdapter.removeMany(state.tabs, getTabsToDelete(tabs))
}

const getTabsToDelete = (tabs: Tab[]): TabId[] => {
  return tabs
    .sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0)) //sort by last visited first
    .slice(MAXIMUM_TABS) //get least visited above limit
    .map(tab => tab.id)
}

export const updateActiveTabId = (state: BrowserState, tabId: TabId): void => {
  if (state.tabs.ids.length === 0) {
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
  browserState: BrowserState,
  tabId: TabId,
  historyId: HistoryId
): void => {
  if (browserState.tabs.activeHistoryId === historyId) {
    const lastVisitedHistoryId = getLastVisitedTabHistoryId(browserState)
    if (!lastVisitedHistoryId) {
      browserState.tabs.activeHistoryId = undefined
      Logger.warn('could not find last visited history id')
      return
    }
    browserState.tabs.activeHistoryId = historyId
    tabAdapter.updateOne(browserState.tabs, {
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

const getLastVisitedTabHistoryId = (state: BrowserState): TabId | undefined => {
  return tabAdapter
    .getSelectors()
    .selectById(state.tabs, state.activeTabId ?? '')?.historyIds[-1]
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
  if (activeHistoryIndex === -1) return
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
