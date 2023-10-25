import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import {
  History,
  Tab,
  TabId,
  BrowserState,
  HistoryState,
  AddHistoryDTO,
  HistoryDTO,
  TabDTO
} from './types'
import { getLatestTab, getOldestTab } from './utils'
import { MAXIMUM_HISTORY, MAXIMUM_TABS } from './const'

const reducerName = 'browser'

const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
export const historyAdapter = createEntityAdapter<History>({
  selectId: history => history.id
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
        histories: historyAdapter.getInitialState()
      })
      state.activeTabId = tabId
    },
    // call addHistory whenever user navigates to a new tab
    addHistory: (state: BrowserState, action: PayloadAction<AddHistoryDTO>) => {
      const historyId = uuidv4()
      const lastVisited = new Date()
      const tabId = action.payload.tabId
      const tab = tabAdapter.getSelectors().selectById(state, tabId)

      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          lastVisited,
          histories: historyAdapter.addOne(tab.histories, {
            ...action.payload.history,
            id: historyId
          })
        }
      })
      tab.histories.activeHistoryId = historyId
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state, tabId)
    },
    removeHistory: (state: BrowserState, action: PayloadAction<HistoryDTO>) => {
      const { tabId, id: historyId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          histories: historyAdapter.removeOne(tab.histories, historyId)
        }
      })
    },
    clearAllTabs: (state: BrowserState) => {
      tabAdapter.removeAll(state)
      state.activeTabId = undefined
    },
    clearAllHistories: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)

      if (tab === undefined) return

      tabAdapter.updateOne(state, {
        id: tabId,
        changes: {
          histories: historyAdapter.removeAll(tab.histories)
        }
      })
      tab.histories.activeHistoryId = undefined
    },
    setActiveTabId: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    setActiveHistoryId: (
      state: BrowserState,
      action: PayloadAction<HistoryDTO>
    ) => {
      const { id: historyId, tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return
      tab.histories.activeHistoryId = historyId
    },
    // side effect of adding a new history is that we need to limit the number of histories
    limitMaxHistory: (state: BrowserState, action: PayloadAction<TabDTO>) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state, tabId)
      if (tab === undefined) return
      const histories = historyAdapter.getSelectors().selectIds(tab.histories)
      if (histories === undefined) return
      if (histories.length > MAXIMUM_HISTORY) {
        const historiesToRemove = histories.slice(
          0,
          histories.length - MAXIMUM_HISTORY
        )
        tabAdapter.updateOne(state, {
          id: tabId,
          changes: {
            histories: historyAdapter.removeMany(
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

export const getLastVisitedHistoryId = (
  state: HistoryState
): TabId | undefined => {
  const histories = historyAdapter.getSelectors().selectAll(state)
  if (histories.length === 0) return undefined
  return histories[histories.length - 1]?.id
}

export const getActiveTab = (state: RootState): Tab | undefined => {
  const activeTabId = state.browser.activeTabId
  if (activeTabId === undefined) return
  return tabAdapter.getSelectors().selectById(state.browser, activeTabId)
}

export const getActiveHistory = (state: RootState): History | undefined => {
  const activeTab = getActiveTab(state)
  if (activeTab?.id === undefined) return

  const activeHistoryId = tabAdapter
    .getSelectors()
    .selectById(state.browser, activeTab.id)?.histories.activeHistoryId

  if (activeHistoryId === undefined) return

  return historyAdapter
    .getSelectors()
    .selectById(activeTab.histories, activeHistoryId)
}

// actions
export const {
  addTab,
  addHistory,
  removeTab,
  removeHistory,
  clearAllTabs,
  clearAllHistories,
  setActiveTabId,
  setActiveHistoryId,
  limitMaxHistory,
  limitMaxTab
} = browserSlice.actions

export const browserReducer = browserSlice.reducer
