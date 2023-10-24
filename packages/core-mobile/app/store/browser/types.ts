import { EntityState } from '@reduxjs/toolkit'

export type TabId = string // unique, generated
export type HistoryId = string // unique, generated

export type TabData = {
  id: TabId
  lastVisited: Date // last time this tab was visited, delete oldest if more than 99 tabs active
  screenshot: string // url to screenshot
  title: string // domain of last active web page
  active?: HistoryId // keep track of active url
  history: HistoryId[] // keep track of all opened urls within one tab so we can navigate between them
}

export type History = {
  id: TabId
  historyId: HistoryId
  after?: HistoryId
}

export type BrowserState = EntityState<TabData> & {
  activeTabId: TabId | undefined
}
