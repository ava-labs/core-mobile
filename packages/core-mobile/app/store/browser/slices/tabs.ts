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
  AddHistoryPayload,
  TabState,
  BrowserState
} from '../types'
import {
  limitMaxTabs,
  navigateTabHistory,
  tabAdapter,
  updateActiveTabHistoryId,
  updateActiveTabId
} from '../utils'
import { MAXIMUM_TAB_HISTORIES } from '../const'

const reducerName = 'browser/tabs'

const initialState = tabAdapter.getInitialState()

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
      const activeHistoryId = state.activeHistoryId

      let indexToInsert = -1
      if (activeHistoryId && tab.historyIds) {
        indexToInsert = tab.historyIds.indexOf(activeHistoryId)
      }
      const historyId = createHash(history.url)
      if (indexToInsert !== -1) {
        tab.historyIds = tab.historyIds.slice(0, indexToInsert)
      }
      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          historyIds: [...tab.historyIds, historyId],
          lastVisited
        }
      })

      state.activeHistoryId = historyId
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
    removeHistoryForTab: (
      state: TabState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tabHistoryIds = tabAdapter
        .getSelectors()
        .selectById(state, tabId)?.historyIds
      if (tabHistoryIds === undefined) return
      tabAdapter.updateOne(state, {
        id: tabId,
        changes: { historyIds: tabHistoryIds.filter(id => id !== historyId) }
      })
      // update active tab history id
      updateActiveTabHistoryId(state, tabId, historyId)
    },
    removeAllTabs: (state: TabState) => {
      tabAdapter.removeAll(state)
      state.activeTabId = undefined
      state.activeHistoryId = undefined
    },
    removeAllHistoryForTab: (
      state: TabState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      tabAdapter.updateOne(state, {
        id: tabId,
        changes: { historyIds: [] }
      })
      state.activeHistoryId = undefined
    },
    setActiveTabId: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    goForward: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      navigateTabHistory(state, 'forward', tabId)
    },
    goBackward: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      navigateTabHistory(state, 'backward', tabId)
    }
  }
})

// selectors
export const selectIsTabEmpty = (state: BrowserState): boolean =>
  tabAdapter.getSelectors().selectAll(state.tabs).length === 0

export const selectAllTabs = (state: BrowserState): Tab[] =>
  tabAdapter.getSelectors().selectAll(state.tabs)

export const selectTab =
  (tabId: TabId) =>
  (state: RootState): Tab | undefined =>
    tabAdapter.getSelectors().selectById(state.browser.tabs, tabId)

export const selectActiveTab = (state: BrowserState): Tab | undefined => {
  if (state.tabs.activeTabId === undefined) return
  return tabAdapter
    .getSelectors()
    .selectById(state.tabs, state.tabs.activeTabId)
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
} = tabSlice.actions

export const tabReducer = tabSlice.reducer
