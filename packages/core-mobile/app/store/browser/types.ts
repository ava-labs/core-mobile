import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated

export type Tab = {
  id: TabId
  lastVisited: Date // last time this tab was visited, delete oldest if more than 99 tabs active
  histories: HistoryState
}

export type History = {
  id: HistoryId
  title: string // title grabbed from html metadata
  url: string // url grabbed from html metadata
  screenshot?: string // url to screenshot
  after?: HistoryId
}

export type BrowserState = EntityState<Tab> & {
  activeTabId?: TabId
}

export type HistoryState = EntityState<History> & {
  activeHistoryId?: HistoryId
}

export type AddHistoryDTO = {
  tabId: TabId
  history: History
}

export type HistoryDTO = {
  tabId: TabId
  id: HistoryId
}

export type TabDTO = {
  id: TabId
}
