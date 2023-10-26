import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryReferendceId = string // unique, generated
export type HistoryId = string // unique, generated

export type Tab = {
  id: TabId
  lastVisited?: number // unix timestamp, last time this tab was visited, delete oldest if more than 99 tabs active
}

export type TabHistory = {
  id: HistoryId
  title: string // title grabbed from html metadata
  url: string // url grabbed from html metadata
  screenshot?: string // url to screenshot
}

export type TabState = EntityState<Tab> & {
  activeTabId?: TabId
}

export type TabHistoryState = EntityState<TabHistory> & {
  activeHistoryId?: HistoryId
}

export type AddTabHistoryDTO = {
  tabId: TabId
  history: Omit<TabHistory, 'id'>
}

export type TabHistoryDTO = {
  tabId: TabId
  id: HistoryId
}

export type TabDTO = {
  id: TabId
}

export type BrowserState = {
  tab: TabState
  tabHistoryByTabId: Map<TabId, TabHistoryState>
}
