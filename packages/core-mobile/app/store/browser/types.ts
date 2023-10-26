import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated

export type Tab = {
  id: TabId
  lastVisited?: number // unix timestamp, last time this tab was visited, delete oldest if more than 99 tabs active
}

export type TabHistory = {
  id: HistoryId
  title: string // title grabbed from html metadata
  url: string // url grabbed from html metadata
  screenshot?: string // id to grab screenshot stored in MMKV
}

export type TabState = EntityState<Tab> & {
  activeTabId?: TabId
}

export type TabHistoryState = EntityState<TabHistory> & {
  activeHistoryId?: HistoryId
}

export type AddTabHistoryPayload = {
  tabId: TabId
  history: Omit<TabHistory, 'id'>
}

export type TabHistoryPayload = {
  tabId: TabId
  id: HistoryId
}

export type TabPayload = {
  id: TabId
}

export type BrowserState = {
  tab: TabState
  history: Record<TabId, TabHistoryState>
}
