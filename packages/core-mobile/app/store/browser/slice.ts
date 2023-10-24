import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { History, TabData, TabId, BrowserState } from './types'
import { getLatestEntity, getOldestEntity } from './utils'
import { MAXIMUM_HISTORY } from './const'

const reducerName = 'inAppBrowser'

const entityAdapter = createEntityAdapter<TabData>()

const initialState: BrowserState = {
  ...entityAdapter.getInitialState(),
  activeTabId: undefined
}

const inAppBrowserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (
      state: BrowserState,
      action: PayloadAction<Omit<TabData, 'id'>>
    ) => {
      const tabId = uuidv4()
      entityAdapter.addOne(state, { ...action.payload, id: tabId })
      state.activeTabId = tabId
    },
    // call addHistory whenever user navigates to a new tab
    addHistory: (state: BrowserState, action: PayloadAction<History>) => {
      const tabId = action.payload.id
      entityAdapter.updateOne(state, {
        id: tabId,
        changes: {
          history: [
            ...(state.entities[tabId]?.history ?? []),
            action.payload.historyId
          ],
          active: action.payload.historyId
        }
      })
    },
    updateActiveHistory: (
      state: BrowserState,
      action: PayloadAction<{ id: TabId }>
    ) => {
      const tabId = action.payload.id
      const newHistory = state.entities[tabId]?.history.slice(0, -1)
      const activeHistory =
        newHistory && newHistory.length > 0
          ? newHistory[newHistory.length - 1]
          : undefined
      entityAdapter.updateOne(state, {
        id: tabId,
        changes: {
          history: newHistory ?? [],
          active: activeHistory
        }
      })
    },
    removeTab: (state: BrowserState, action: PayloadAction<{ id: TabId }>) => {
      const { id } = action.payload
      entityAdapter.removeOne(state, id)
    },
    clearAllTabs: (state: BrowserState, _: PayloadAction) => {
      entityAdapter.removeAll(state)
      state.activeTabId = undefined
    },
    setActiveTabId: (
      state: BrowserState,
      action: PayloadAction<{ id: TabId }>
    ) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    limitMaxHistory: (
      state: BrowserState,
      action: PayloadAction<{ id: TabId }>
    ) => {
      const { id: tabId } = action.payload
      const tab = state.entities[tabId]
      if (!tab) return
      if (tab.history.length > MAXIMUM_HISTORY) {
        tab.history.shift()
      }
    }
  }
})

// selectors
export const isEmpty = (state: RootState): boolean =>
  entityAdapter.getSelectors().selectAll(state.browser).length === 0

export const getLastVisitedTabId = (state: BrowserState): TabId | undefined => {
  const tabs = entityAdapter.getSelectors().selectAll(state)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestEntity(tabs)
  return lastVisitedTab?.id
}

export const getOldestTabId = (state: BrowserState): TabId | undefined => {
  const tabs = entityAdapter.getSelectors().selectAll(state)
  if (tabs.length === 0) return undefined
  const oldestTab = getOldestEntity(tabs)
  return oldestTab?.id
}

// actions
export const {
  addTab,
  addHistory,
  removeTab,
  clearAllTabs,
  setActiveTabId,
  limitMaxHistory,
  updateActiveHistory
} = inAppBrowserSlice.actions

export const browserReducer = inAppBrowserSlice.reducer
