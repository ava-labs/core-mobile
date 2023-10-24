import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { History, TabData, TabId, InAppBrowserState } from './types'
import { getLatestEntity, getOldestEntity } from './utils'
import { MAXIMUM_HISTORY } from './const'

const reducerName = 'inAppBrowser'

const entityAdapter = createEntityAdapter<TabData>()

const initialState: InAppBrowserState = {
  ...entityAdapter.getInitialState(),
  activeTabId: undefined
}

const inAppBrowserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (
      state: InAppBrowserState,
      action: PayloadAction<Omit<TabData, 'id'>>
    ) => {
      const tabId = uuidv4()
      entityAdapter.addOne(state, { ...action.payload, id: tabId })
      state.activeTabId = tabId
    },
    // call addHistory whenever user navigates to a new tab
    addHistory: (state: InAppBrowserState, action: PayloadAction<History>) => {
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
      state: InAppBrowserState,
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
    removeTab: (
      state: InAppBrowserState,
      action: PayloadAction<{ id: TabId }>
    ) => {
      const { id } = action.payload
      entityAdapter.removeOne(state, id)
    },
    clearAllTabs: (state: InAppBrowserState, _: PayloadAction) => {
      entityAdapter.removeAll(state)
      state.activeTabId = undefined
    },
    setActiveTabId: (
      state: InAppBrowserState,
      action: PayloadAction<{ id: TabId }>
    ) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    limitMaxHistory: (
      state: InAppBrowserState,
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
  entityAdapter.getSelectors().selectAll(state.inAppBrowser).length === 0

export const getLastVisitedTabId = (
  state: InAppBrowserState
): TabId | undefined => {
  const tabs = entityAdapter.getSelectors().selectAll(state)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestEntity(tabs)
  return lastVisitedTab?.id
}

export const getOldestTabId = (state: InAppBrowserState): TabId | undefined => {
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

export const inAppBrowserReducer = inAppBrowserSlice.reducer
