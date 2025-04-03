import { PartialBy } from '@avalabs/vm-module-types'
import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated
export type FavoriteId = string // unique, generated

export type Tab = {
  id: TabId
  historyIds: HistoryId[] // array of history indices
  lastVisited?: number // unix timestamp, last time this tab was visited, delete oldest if more than 99 tabs active
  createdAt: number // unix timestamp, when this tab was created
  activeHistoryIndex: number
  activeHistory?: History
}

export type History = {
  id: HistoryId
  title: string // title grabbed from html metadata
  url: string // url grabbed from html metadata
  lastVisited: number
  description?: string // description grabbed from html metadata
  favicon?: string // url to favicon
}

export type TabState = EntityState<Tab> & {
  activeTabId: TabId
}

export type HistoryState = EntityState<History>

export type AddHistoryPayload = Omit<History, 'id' | 'lastVisited'>

export type UpdateHistoryPayload = Omit<
  History,
  'url' | 'lastVisited' | 'title'
>

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
  title: string //title grabbed from html metadata
  description: string //description grabbed from html metadata
  url: string
  favicon?: string //url to favicon
}

export type UpdateFavoritePayload = Omit<
  PartialBy<Favorite, 'description' | 'title'>,
  'url'
>

export type FavoriteState = EntityState<Favorite>
