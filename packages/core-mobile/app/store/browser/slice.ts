import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import {
  TabHistory,
  Tab,
  TabId,
  TabHistoryPayload,
  TabPayload,
  BrowserState,
  AddHistoryPayload
} from './types'
import {
  historyAdapter,
  limitMaxHistories,
  limitMaxTabHistories,
  limitMaxTabs,
  navigateTabHistory,
  tabAdapter,
  tabHistoryAdapter,
  updateActiveTabHistoryId,
  updateActiveTabId
} from './utils'

const reducerName = 'browser'

const initialState: BrowserState = {
  tabs: tabAdapter.getInitialState(),
  tabHistories: {},
  histories: historyAdapter.getInitialState()
}

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (state: BrowserState) => {
      const tabId = uuidv4()
      tabAdapter.addOne(state.tabs, {
        id: tabId
      })
      state.tabs.activeTabId = tabId
      state.tabHistories[tabId] = tabHistoryAdapter.getInitialState()
      // limit max tabs
      limitMaxTabs(state)
    },
    addTabHistory: (
      state: BrowserState,
      action: PayloadAction<AddHistoryPayload>
    ) => {
      const { tabId, history } = action.payload
      const lastVisited = getUnixTime(new Date())
      const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)

      if (tab === undefined) return

      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return

      let indexToInsert = -1
      if (tabHistoryState.activeHistoryId) {
        indexToInsert = tabHistoryAdapter
          .getSelectors()
          .selectIds(tabHistoryState)
          .indexOf(tabHistoryState.activeHistoryId)
      }
      if (indexToInsert !== -1) {
        tabHistoryAdapter.removeMany(
          tabHistoryState,
          tabHistoryState.ids.slice(indexToInsert + 1)
        )
      }
      const historyId = createHash(history.url)

      historyAdapter.upsertOne(state.histories, {
        ...action.payload.history,
        id: historyId
      })
      tabHistoryAdapter.addOne(tabHistoryState, {
        id: historyId
      })
      tabHistoryState.activeHistoryId = historyId
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: {
          lastVisited
        }
      })
      // limit max tab histories
      limitMaxTabHistories(tabHistoryState)
      // limit max histories
      limitMaxHistories(state.histories)
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state.tabs, tabId)
      delete state.tabHistories[tabId]
      // update active tab id
      updateActiveTabId(state, tabId)
    },
    removeTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryAdapter.removeOne(tabHistoryState, historyId)
      // update active tab history id
      updateActiveTabHistoryId(tabHistoryState, state.tabs, tabId, historyId)
    },
    clearAllTabs: (state: BrowserState) => {
      tabAdapter.removeAll(state.tabs)
      state.tabs.activeTabId = undefined
      state.tabHistories = {}
    },
    clearAllTabHistories: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryAdapter.removeAll(tabHistoryState)
      tabHistoryState.activeHistoryId = undefined
    },
    setActiveTabId: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      state.tabs.activeTabId = tabId
    },
    goForwardInHistory: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      navigateTabHistory(state, 'forward', tabId)
    },
    goBackwardInHistory: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      navigateTabHistory(state, 'backward', tabId)
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

export const selectActiveTab = (state: RootState): Tab | undefined => {
  if (state.browser.tabs.activeTabId === undefined) return
  return tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.tabs.activeTabId)
}

export const getActiveTab = (state: RootState): Tab | undefined => {
  const activeTabId = state.browser.tabs.activeTabId
  if (activeTabId === undefined) return
  return tabAdapter.getSelectors().selectById(state.browser.tabs, activeTabId)
}

export const getActiveTabHistory = (
  state: RootState
): TabHistory | undefined => {
  const activeTab = getActiveTab(state)
  if (activeTab?.id === undefined) return
  const tabHistoryState = state.browser.tabHistories[activeTab.id]
  if (tabHistoryState?.activeHistoryId === undefined) return
  return tabHistoryAdapter
    .getSelectors()
    .selectById(tabHistoryState, tabHistoryState.activeHistoryId)
}

// actions
export const {
  addTab,
  addTabHistory,
  removeTab,
  removeTabHistory,
  clearAllTabs,
  clearAllTabHistories,
  setActiveTabId,
  goBackwardInHistory,
  goForwardInHistory
} = browserSlice.actions

export const browserReducer = browserSlice.reducer
