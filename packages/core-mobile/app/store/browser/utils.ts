import { createEntityAdapter } from '@reduxjs/toolkit'
import { MAXIMUM_TABS } from './const'
import { Favorite, History, Tab, TabId, TabState } from './types'

export const getOldestTab = (tabs: Tab[], count: number): Tab[] => {
  return tabs
    .sort((a, b) => (a.lastVisited ?? 0) - (b.lastVisited ?? 0))
    .slice(0, count - 1)
}

export const getLatestTab = (tabs: Tab[]): Tab => {
  const latestTab = tabs.sort(
    (a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0)
  )[0]
  if (latestTab === undefined)
    throw Error('tabs should have at least one element')
  return latestTab
}

export const tabAdapter = createEntityAdapter<Readonly<Tab>>({
  selectId: tab => tab.id
})
export const tabAdapterSelectors = tabAdapter.getSelectors()

export const historyAdapter = createEntityAdapter<Readonly<History>>({
  selectId: history => history.id
})
export const favoriteAdapter = createEntityAdapter<Readonly<Favorite>>({
  selectId: favorite => favorite.id
})

export const limitMaxTabs = (state: TabState): void => {
  const tabs = tabAdapterSelectors.selectAll(state)
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
  if (state.activeTabId === tabId) {
    state.activeTabId = getLastVisitedTabId(state)
  }
}

const getLastVisitedTabId = (state: TabState): TabId => {
  const tabs = tabAdapterSelectors.selectAll(state)
  if (tabs.length === 0) throw Error('tabs should have at least one item')
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab.id
}
