import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import {
  Tab,
  TabId,
  TabHistoryPayload,
  TabPayload,
  BrowserState,
  AddHistoryPayload
} from './types'
import {
  historyAdapter,
  limitMaxTabs,
  navigateTabHistory,
  tabAdapter,
  updateActiveTabHistoryId,
  updateActiveTabId
} from './utils'
import { MAXIMUM_HISTORIES, MAXIMUM_TAB_HISTORIES } from './const'

const reducerName = 'browser'

const initialState: BrowserState = {
  tabs: tabAdapter.getInitialState(),
  globalHistory: historyAdapter.getInitialState()
}

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (state: BrowserState) => {
      const tabId = uuidv4()
      tabAdapter.addOne(state.tabs, {
        id: tabId,
        historyIds: []
      })
      state.activeTabId = tabId
      // limit max tabs
      limitMaxTabs(state)
    },
    addHistoryForTab: (
      state: BrowserState,
      action: PayloadAction<AddHistoryPayload>
    ) => {
      const { tabId, history } = action.payload
      const lastVisited = getUnixTime(new Date())
      const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)
      if (tab === undefined) return
      const activeHistoryId = state.tabs.activeHistoryId

      let indexToInsert = -1
      if (activeHistoryId && tab.historyIds) {
        indexToInsert = tab.historyIds.indexOf(activeHistoryId)
      }
      const historyId = createHash(history.url)
      if (indexToInsert !== -1) {
        tab.historyIds = tab.historyIds.slice(0, indexToInsert)
      }
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: {
          historyIds: [...tab.historyIds, historyId],
          lastVisited
        }
      })

      historyAdapter.upsertOne(state.globalHistory, {
        ...action.payload.history,
        id: historyId
      })
      state.tabs.activeHistoryId = historyId
      // limit max tab histories
      if (tab.historyIds.length > MAXIMUM_TAB_HISTORIES) {
        tab.historyIds = tab.historyIds.slice(-MAXIMUM_TAB_HISTORIES)
      }
      // limit max histories
      if (state.globalHistory.ids.length > MAXIMUM_TAB_HISTORIES) {
        const historiesToRemove = historyAdapter
          .getSelectors()
          .selectIds(state.globalHistory)
          .slice(0, -MAXIMUM_HISTORIES)
        historyAdapter.removeMany(state.globalHistory, historiesToRemove)
      }
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state.tabs, tabId)
      // update active tab id
      updateActiveTabId(state, tabId)
    },
    removeHistoryForTab: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tabHistoryIds = tabAdapter
        .getSelectors()
        .selectById(state.tabs, tabId)?.historyIds
      if (tabHistoryIds === undefined) return
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: { historyIds: tabHistoryIds.filter(id => id !== historyId) }
      })
      // update active tab history id
      updateActiveTabHistoryId(state, tabId, historyId)
    },
    removeAllTabs: (state: BrowserState) => {
      tabAdapter.removeAll(state.tabs)
      state.activeTabId = undefined
      state.tabs.activeHistoryId = undefined
    },
    removeAllHistoryForTab: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: { historyIds: [] }
      })
      state.tabs.activeHistoryId = undefined
    },
    setActiveTabId: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    goForward: (state: BrowserState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      navigateTabHistory(state, 'forward', tabId)
    },
    goBackward: (state: BrowserState, action: PayloadAction<TabPayload>) => {
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
  if (state.browser.activeTabId === undefined) return
  return tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.activeTabId)
}

// actions
export const {
  addTab,
  addHistoryForTab,
  removeTab,
  removeHistoryForTab,
  removeAllTabs,
  removeAllHistoryForTab,
  setActiveTabId,
  goBackward,
  goForward
} = browserSlice.actions

export const browserReducer = browserSlice.reducer
