import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated

export type Tab = {
  id: TabId
  lastVisited?: number // unix timestamp, last time this tab was visited, delete oldest if more than 99 tabs active
}

export type TabHistory = {
  id: HistoryId
}

export type History = {
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

export type HistoryState = EntityState<History>

export type AddHistoryPayload = {
  tabId: TabId
  history: Omit<History, 'id'>
}

export type TabHistoryPayload = {
  tabId: TabId
  id: HistoryId
}

export type TabPayload = {
  id: TabId
}

export type BrowserState = {
  tabs: TabState
  tabHistories: Record<TabId, TabHistoryState>
  histories: HistoryState
}
