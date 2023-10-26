import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import Logger from 'utils/Logger'
import {
  TabHistory,
  Tab,
  TabId,
  BrowserState,
  TabHistoryState,
  AddTabHistoryDTO,
  TabHistoryDTO,
  TabDTO
} from './types'
import { getLatestTab, getOldestTab } from './utils'
import { MAXIMUM_HISTORY, MAXIMUM_TABS } from './const'

const reducerName = 'browser'

const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
const tabHistoryAdapter = createEntityAdapter<TabHistory>({
  selectId: tabHistory => tabHistory.id
})

const initialState: BrowserState = {
  ...tabAdapter.getInitialState()
}

const browserSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addTab: (state: BrowserState) => {
      const tabId = uuidv4()
      const lastVisited = new Date()
      tabAdapter.addOne(state, {
        id: tabId,
        lastVisited,
        histories: tabHistoryAdapter.getInitialState()
      })
      state.activeTabId = tabId
      limitMaxTab()
    },
    // call addHistory whenever user navigates to a new tab
    addTabHistory: (
      state: BrowserState,
      action: PayloadAction<AddTabHistoryDTO>
    ) => {
      const historyId = uuidv4()
      const lastVisited = new Date()
      const tabId = action.payload.tabId
      const tab = tabAdapter.getSelectors().selectById(state, tabId)

      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          lastVisited,
          histories: tabHistoryAdapter.addOne(tab.histories, {
            ...action.payload.history,
            id: historyId
          })
        }
      })
      tab.histories.activeHistoryId = historyId
      limitMaxTabHistory({ id: tabId })
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state, tabId)

      if (state.ids.length === 0) {
        state.activeTabId = undefined
        return
      }
      if (state.activeTabId === tabId) {
        const lastVisitedTabId = getLastVisitedTabId(state)
        if (!lastVisitedTabId) {
          Logger.warn('could not find last visited tab id')
          return
        }
        setActiveTabId({ id: lastVisitedTabId })
      }
    },
    removeTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabHistoryDTO>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          histories: tabHistoryAdapter.removeOne(tab.histories, historyId)
        }
      })
      const historyState = tabAdapter
        .getSelectors()
        .selectById(state, tabId)?.histories
      if (historyState?.ids.length === 0) {
        tab.histories.activeHistoryId = undefined
        return
      }
      if (historyState?.activeHistoryId === historyId) {
        const lastVisitedHistoryId = getLastVisitedTabHistoryId(historyState)
        if (!lastVisitedHistoryId) {
          Logger.warn('could not find last visited history id')
          return
        }
        setActiveTabHistoryId({ id: lastVisitedHistoryId, tabId })
      }
    },
    clearAllTabs: (state: BrowserState) => {
      tabAdapter.removeAll(state)
      state.activeTabId = undefined
    },
    clearAllTabHistories: (
      state: BrowserState,
      action: PayloadAction<TabDTO>
    ) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)

      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          histories: tabHistoryAdapter.removeAll(tab.histories)
        }
      })
      tab.histories.activeHistoryId = undefined
    },
    setActiveTabId: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    setActiveTabHistoryId: (
      state: BrowserState,
      action: PayloadAction<TabHistoryDTO>
    ) => {
      const { id: historyId, tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return
      tab.histories.activeHistoryId = historyId
    },
    // side effect of adding a new history is that we need to limit the number of histories
    limitMaxTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabDTO>
    ) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return
      const histories = tabHistoryAdapter
        .getSelectors()
        .selectIds(tab.histories)
      if (histories === undefined) return
      if (histories.length > MAXIMUM_HISTORY) {
        const historiesToRemove = histories.slice(
          0,
          histories.length - MAXIMUM_HISTORY
        )
        tabAdapter.updateOne(state, {
          id: tabId,
          changes: {
            histories: tabHistoryAdapter.removeMany(
              tab.histories,
              historiesToRemove
            )
          }
        })
      }
    },
    // side effect of adding a new tab is that we need to limit the number of tabs
    limitMaxTab: (state: BrowserState) => {
      const tabIds = tabAdapter.getSelectors().selectIds(state)
      if (tabIds.length > MAXIMUM_TABS) {
        const tabIdsToRemove = tabIds.slice(0, tabIds.length - MAXIMUM_TABS)
        tabAdapter.removeMany(state, tabIdsToRemove)
      }
    }
  }
})

// selectors
export const isTabEmpty = (state: RootState): boolean =>
  tabAdapter.getSelectors().selectAll(state.browser).length === 0

export const getLastVisitedTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab?.id
}

export const getOldestTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state)
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
  const activeTabId = state.browser.activeTabId
  if (activeTabId === undefined) return
  return tabAdapter.getSelectors().selectById(state.browser, activeTabId)
}

export const getActiveTabHistory = (
  state: RootState
): TabHistory | undefined => {
  const activeTab = getActiveTab(state)
  if (activeTab?.id === undefined) return

  const activeHistoryId = tabAdapter
    .getSelectors()
    .selectById(state.browser, activeTab.id)?.histories.activeHistoryId

  if (activeHistoryId === undefined) return

  return tabHistoryAdapter
    .getSelectors()
    .selectById(activeTab.histories, activeHistoryId)
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
