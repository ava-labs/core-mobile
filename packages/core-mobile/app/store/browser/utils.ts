import { createEntityAdapter } from '@reduxjs/toolkit'
import { getUnixTime } from 'date-fns'
import Logger from 'utils/Logger'
import { MAXIMUM_HISTORIES, MAXIMUM_TABS, MAXIMUM_TAB_HISTORIES } from './const'
import {
  Tab,
  BrowserState,
  TabHistory,
  History,
  TabId,
  TabHistoryState,
  HistoryState,
  TabState,
  HistoryId
} from './types'

export const getOldestTab = (tabs: Tab[], count: number): Tab[] => {
  return tabs
    .sort((a, b) => (a.lastVisited ?? 0) - (b.lastVisited ?? 0))
    .slice(0, count - 1)
}

export const getLatestTab = (tabs: Tab[]): Tab | undefined => {
  return tabs.sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))[0]
}

export const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
export const tabHistoryAdapter = createEntityAdapter<TabHistory>({
  selectId: tabHistory => tabHistory.id
})
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
    oldestTabIds.forEach(idToRemove => {
      delete state.tabHistories[idToRemove]
    })
    historyAdapter.removeMany(state.histories, oldestTabIds)
  }
}

export const limitMaxTabHistories = (state: TabHistoryState): void => {
  const tabHistoryIds = tabHistoryAdapter.getSelectors().selectIds(state)

  if (tabHistoryIds.length > MAXIMUM_TAB_HISTORIES) {
    const historiesToRemove = tabHistoryIds.slice(
      0,
      tabHistoryIds.length - MAXIMUM_TAB_HISTORIES
    )
    tabHistoryAdapter.removeMany(state, historiesToRemove)
  }
}

export const limitMaxHistories = (state: HistoryState): void => {
  const historiesIds = historyAdapter.getSelectors().selectIds(state)
  if (historiesIds.length > MAXIMUM_HISTORIES) {
    const historiesToRemove = historiesIds.slice(
      0,
      historiesIds.length - MAXIMUM_HISTORIES
    )
    historyAdapter.removeMany(state, historiesToRemove)
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
  tabHistoryState: TabHistoryState,
  tabState: TabState,
  tabId: TabId,
  historyId: HistoryId
): void => {
  if (tabHistoryState.ids.length === 0) {
    tabHistoryState.activeHistoryId = undefined
    return
  }
  if (tabHistoryState?.activeHistoryId === historyId) {
    const lastVisitedHistoryId = getLastVisitedTabHistoryId(tabHistoryState)
    if (!lastVisitedHistoryId) {
      tabHistoryState.activeHistoryId = undefined
      Logger.warn('could not find last visited history id')
      return
    }
    tabHistoryState.activeHistoryId = historyId
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

const getLastVisitedTabHistoryId = (
  state: TabHistoryState
): TabId | undefined => {
  const histories = tabHistoryAdapter.getSelectors().selectAll(state)
  if (histories.length === 0) return undefined
  return histories[histories.length - 1]?.id
}

export const navigateTabHistory = (
  state: BrowserState,
  action: 'forward' | 'backward',
  tabId: TabId
): void => {
  const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)
  if (tab === undefined) return
  const tabHistoryState = state.tabHistories[tabId]
  if (tabHistoryState === undefined) return
  const activeHistoryId = tabHistoryState.activeHistoryId
  if (activeHistoryId === undefined) return
  const activeHistoryIndex = tabHistoryState.ids.indexOf(activeHistoryId)
  const historyId = tabHistoryState.ids[activeHistoryIndex + 1]
  if (historyId === undefined) return
  tabHistoryState.activeHistoryId = historyId.toString()
  tabAdapter.updateOne(state.tabs, {
    id: tabId,
    changes: {
      lastVisited: getUnixTime(new Date())
    }
  })
}
