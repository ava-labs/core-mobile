import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated
export type FavoriteId = string // unique, generated

export type Tab = {
  id: TabId
  lastVisited?: number // unix timestamp, last time this tab was visited, delete oldest if more than 99 tabs active
  historyIds: HistoryId[] // array of history indices
}

export type History = {
  id: HistoryId
  title: string // title grabbed from html metadata
  url: string // url grabbed from html metadata
  screenshot?: string // id to grab screenshot stored in MMKV
}

export type TabState = EntityState<Tab> & {
  activeTabId?: TabId
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
  globalHistory: HistoryState
  favorites: FavoriteState
}

export type Favorite = {
  id: FavoriteId
  favicon: string //url to favicon
  title: string //title grabbed from html metadata
  description: string //description grabbed from html metadata
  url: string
}

export type FavoriteState = EntityState<Favorite>
