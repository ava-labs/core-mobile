import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import Logger from 'utils/Logger'
import { getUnixTime } from 'date-fns'
import {
  TabHistory,
  Tab,
  TabId,
  TabHistoryState,
  AddTabHistoryPayload,
  TabHistoryPayload,
  TabPayload,
  BrowserState
} from './types'
import { getLatestTab, getOldestTab } from './utils'
import { MAXIMUM_HISTORY, MAXIMUM_TABS } from './const'

const reducerName = 'browser'

const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
const tabHistoryAdapter = createEntityAdapter<TabHistory>({
  selectId: tabHistory => tabHistory.id
})

const initialState: BrowserState = {
  tab: tabAdapter.getInitialState(),
  history: {}
}

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (state: BrowserState) => {
      const tabId = uuidv4()
      tabAdapter.addOne(state.tab, {
        id: tabId
      })
      state.tab.activeTabId = tabId
      state.history[tabId] = tabHistoryAdapter.getInitialState()
      limitMaxTab()
    },
    // call addHistory whenever user navigates to a new tab
    addTabHistory: (
      state: BrowserState,
      action: PayloadAction<AddTabHistoryPayload>
    ) => {
      const historyId = uuidv4()
      const lastVisited = getUnixTime(new Date())
      const tabId = action.payload.tabId
      const tab = tabAdapter.getSelectors().selectById(state.tab, tabId)

      if (tab === undefined) return

      tabAdapter.updateOne(state.tab, {
        id: tabId,
        changes: {
          lastVisited
        }
      })
      const tabHistoryState = state.history[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryAdapter.addOne(tabHistoryState, {
        ...action.payload.history,
        id: historyId
      })

      tabHistoryState.activeHistoryId = historyId
      limitMaxTabHistory({ id: tabId })
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state.tab, tabId)

      if (state.tab.ids.length === 0) {
        state.tab.activeTabId = undefined
        return
      }
      if (state.tab.activeTabId === tabId) {
        const lastVisitedTabId = getLastVisitedTabId(state)
        if (!lastVisitedTabId) {
          Logger.warn('could not find last visited tab id')
          return
        }
        state.tab.activeTabId = lastVisitedTabId
      }
    },
    removeTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tabHistoryState = state.history[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryAdapter.removeOne(tabHistoryState, historyId)

      if (tabHistoryState?.ids.length === 0) {
        tabHistoryState.activeHistoryId = undefined
        return
      }
      if (tabHistoryState?.activeHistoryId === historyId) {
        const lastVisitedHistoryId = getLastVisitedTabHistoryId(tabHistoryState)
        if (!lastVisitedHistoryId) {
          Logger.warn('could not find last visited history id')
          return
        }
        setActiveTabHistoryId({ id: lastVisitedHistoryId, tabId })
      }
    },
    clearAllTabs: (state: BrowserState) => {
      tabAdapter.removeAll(state.tab)
      state.tab.activeTabId = undefined
      state.history = {}
    },
    clearAllTabHistories: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      const tabHistoryState = state.history[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryAdapter.removeAll(tabHistoryState)
      tabHistoryState.activeHistoryId = undefined
    },
    setActiveTabId: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      state.tab.activeTabId = tabId
    },
    setActiveTabHistoryId: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const lastVisited = getUnixTime(new Date())
      const { id: historyId, tabId } = action.payload
      const tabHistoryState = state.history[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryState.activeHistoryId = historyId
      tabAdapter.updateOne(state.tab, {
        id: tabId,
        changes: {
          lastVisited
        }
      })
    },
    // side effect of adding a new history is that we need to limit the number of histories
    limitMaxTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      const tabHistoryState = state.history[tabId]
      if (tabHistoryState === undefined) return

      const historyIds = tabHistoryAdapter
        .getSelectors()
        .selectIds(tabHistoryState)
      if (historyIds === undefined) return

      if (historyIds.length > MAXIMUM_HISTORY) {
        const historiesToRemove = historyIds.slice(
          0,
          historyIds.length - MAXIMUM_HISTORY
        )
        tabHistoryAdapter.removeMany(tabHistoryState, historiesToRemove)
      }
    },
    // side effect of adding a new tab is that we need to limit the number of tabs
    limitMaxTab: (state: BrowserState) => {
      const tabIds = tabAdapter.getSelectors().selectIds(state.tab)
      if (tabIds.length > MAXIMUM_TABS) {
        const tabIdsToRemove = tabIds.slice(0, tabIds.length - MAXIMUM_TABS)
        tabAdapter.removeMany(state.tab, tabIdsToRemove)
        tabIdsToRemove.forEach(tabId => {
          delete state.history[tabId]
        })
      }
    }
  }
})

// selectors
export const isTabEmpty = (state: RootState): boolean =>
  tabAdapter.getSelectors().selectAll(state.browser.tab).length === 0

export const getLastVisitedTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tab)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab?.id
}

export const getOldestTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tab)
  if (tabs.length === 0) return undefined
  const oldestTab = getOldestTab(tabs)
  return oldestTab?.id
}

export const getLastVisitedTabHistoryId = (
  state: TabHistoryState
): TabId | undefined => {
  const histories = tabHistoryAdapter.getSelectors().selectAll(state)
  if (histories.length === 0) return undefined
  return histories[histories.length - 1]?.id
}

export const getActiveTab = (state: RootState): Tab | undefined => {
  const activeTabId = state.browser.tab.activeTabId
  if (activeTabId === undefined) return
  return tabAdapter.getSelectors().selectById(state.browser.tab, activeTabId)
}

export const getActiveTabHistory = (
  state: RootState
): TabHistory | undefined => {
  const activeTab = getActiveTab(state)
  if (activeTab?.id === undefined) return
  const tabHistoryState = state.browser.history[activeTab.id]
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
  setActiveTabHistoryId,
  limitMaxTabHistory,
  limitMaxTab
} = browserSlice.actions

export const browserReducer = browserSlice.reducer
