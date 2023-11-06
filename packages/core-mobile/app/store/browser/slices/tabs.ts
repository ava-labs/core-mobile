import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import { Tab, TabId, TabPayload, AddHistoryPayload, TabState } from '../types'
import {
  limitMaxTabs,
  navigateTabHistory,
  tabAdapter,
  updateActiveTabId
} from '../utils'
import { MAXIMUM_TAB_HISTORIES } from '../const'

const reducerName = 'browser/tabs'

const initialState = {
  ...tabAdapter.getInitialState(),
  activeTabId: undefined
}

const tabSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (state: TabState) => {
      const tabId = uuidv4()
      tabAdapter.addOne(state, {
        id: tabId,
        historyIds: []
      })
      state.activeTabId = tabId
      // limit max tabs
      limitMaxTabs(state)
    },
    addHistoryForTab: (
      state: TabState,
      action: PayloadAction<AddHistoryPayload>
    ) => {
      const { tabId, history } = action.payload
      const lastVisited = getUnixTime(new Date())

      const tab = tabAdapter.getSelectors().selectById(state, tabId)

      if (tab === undefined) return
      const activeHistoryId = tab.activeHistoryId

      let indexToInsert = -1

      if (activeHistoryId && tab.historyIds) {
        indexToInsert = tab.historyIds.indexOf(activeHistoryId)
      }
      const historyId = createHash(history.url)
      if (indexToInsert !== -1) {
        tab.historyIds = tab.historyIds.slice(0, indexToInsert + 1)
      }

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          historyIds: [...tab.historyIds, historyId],
          lastVisited,
          activeHistoryId: historyId
        }
      })

      // limit max tab histories
      if (tab.historyIds.length > MAXIMUM_TAB_HISTORIES) {
        tab.historyIds = tab.historyIds.slice(-MAXIMUM_TAB_HISTORIES)
      }
    },
    removeTab: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state, tabId)
      // update active tab id
      updateActiveTabId(state, tabId)
    },
    removeAllTabs: (state: TabState) => {
      tabAdapter.removeAll(state)
      state.activeTabId = undefined
    },
    setActiveTabId: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    goForward: (state: TabState) => {
      const activeTabId = state.activeTabId
      if (activeTabId === undefined) return
      navigateTabHistory(state, 'forward', activeTabId)
    },
    goBackward: (state: TabState) => {
      const activeTabId = state.activeTabId
      if (activeTabId === undefined) return
      navigateTabHistory(state, 'backward', activeTabId)
    }
  }
})

// selectors
export const selectIsTabEmpty = (state: RootState): boolean =>
  tabAdapter.getSelectors().selectAll(state.browser.tabs).length === 0

export const selectAllTabs = (state: RootState): Tab[] =>
  tabAdapter.getSelectors().selectAll(state.browser.tabs)

export const selectTab =
  (tabId: TabId) =>
  (state: RootState): Tab | undefined =>
    tabAdapter.getSelectors().selectById(state.browser.tabs, tabId)

export const selectCanGoBack = (state: RootState): boolean => {
  if (state.browser.tabs.activeTabId === undefined) return false
  const activeTab = tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.tabs.activeTabId)
  if (activeTab && activeTab.activeHistoryId) {
    return activeTab.historyIds.indexOf(activeTab.activeHistoryId) > 0
  }
  return false
}

export const selectCanGoForward = (state: RootState): boolean => {
  if (state.browser.tabs.activeTabId === undefined) return false
  const activeTab = tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.tabs.activeTabId)
  if (activeTab && activeTab.activeHistoryId) {
    return (
      activeTab.historyIds.indexOf(activeTab.activeHistoryId) <
      activeTab.historyIds.length - 1
    )
  }
  return false
}

export const selectActiveTab = (state: RootState): Tab | undefined => {
  if (state.browser.tabs.activeTabId === undefined) return
  return tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.tabs.activeTabId)
}

// actions
export const {
  addTab,
  addHistoryForTab,
  removeTab,
  removeAllTabs,
  setActiveTabId,
  goBackward,
  goForward
} = tabSlice.actions

export const tabReducer = tabSlice.reducer
