import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import Logger from 'utils/Logger'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import {
  TabHistory,
  Tab,
  TabId,
  TabHistoryState,
  TabHistoryPayload,
  TabPayload,
  BrowserState,
  History,
  AddHistoryPayload
} from './types'
import { getLatestTab, getOldestTab } from './utils'
import { MAXIMUM_HISTORIES, MAXIMUM_TAB_HISTORIES, MAXIMUM_TABS } from './const'

const reducerName = 'browser'

const tabAdapter = createEntityAdapter<Tab>({ selectId: tab => tab.id })
const tabHistoryAdapter = createEntityAdapter<TabHistory>({
  selectId: tabHistory => tabHistory.id
})
const historyAdapter = createEntityAdapter<History>({
  selectId: history => history.id
})

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
      const tabIds = tabAdapter.getSelectors().selectIds(state.tabs)
      if (tabIds.length > MAXIMUM_TABS) {
        const numberOfTabsToRemove = tabIds.length - MAXIMUM_TABS
        const oldestTabIds = getOldestTabIds(state, numberOfTabsToRemove)
        if (oldestTabIds === undefined) return
        tabAdapter.removeMany(state.tabs, oldestTabIds)
        oldestTabIds.forEach(idToRemove => {
          delete state.tabHistories[idToRemove]
        })
        historyAdapter.removeMany(state.histories, oldestTabIds)
      }
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

      historyAdapter.addOne(state.histories, {
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
      const tabHistoryIds = tabHistoryAdapter
        .getSelectors()
        .selectIds(tabHistoryState)

      if (tabHistoryIds.length > MAXIMUM_TAB_HISTORIES) {
        const historiesToRemove = tabHistoryIds.slice(
          0,
          tabHistoryIds.length - MAXIMUM_TAB_HISTORIES
        )
        tabHistoryAdapter.removeMany(tabHistoryState, historiesToRemove)
      }

      // limit max histories
      const historiesIds = historyAdapter
        .getSelectors()
        .selectIds(state.histories)
      if (historiesIds.length > MAXIMUM_HISTORIES) {
        const historiesToRemove = historiesIds.slice(
          0,
          historiesIds.length - MAXIMUM_HISTORIES
        )
        historyAdapter.removeMany(state.histories, historiesToRemove)
      }
    },
    removeTab: (state: BrowserState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state.tabs, tabId)
      delete state.tabHistories[tabId]

      if (state.tabs.ids.length === 0) {
        state.tabs.activeTabId = undefined
        return
      }
      if (state.tabs.activeTabId === tabId) {
        const lastVisitedTabId = getLastVisitedTabId(state)
        if (!lastVisitedTabId) {
          state.tabs.activeTabId = undefined
          Logger.warn('could not find last visited tab id')
          return
        }
        state.tabs.activeTabId = lastVisitedTabId
      }
    },
    removeTabHistory: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { tabId, id: historyId } = action.payload
      const tabHistoryState = state.tabHistories[tabId]
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
    setActiveTabHistoryId: (
      state: BrowserState,
      action: PayloadAction<TabHistoryPayload>
    ) => {
      const { id: historyId, tabId } = action.payload
      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return
      tabHistoryState.activeHistoryId = historyId
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: {
          lastVisited: getUnixTime(new Date())
        }
      })
    },
    goForwardInHistory: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)
      if (tab === undefined) return
      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return
      const activeHistoryId = tabHistoryState.activeHistoryId
      if (activeHistoryId === undefined) return
      const activeHistoryIndex = tabHistoryState.ids.indexOf(activeHistoryId)
      const nextHistoryId = tabHistoryState.ids[activeHistoryIndex + 1]
      if (nextHistoryId === undefined) return
      tabHistoryState.activeHistoryId = nextHistoryId.toString()
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: {
          lastVisited: getUnixTime(new Date())
        }
      })
    },
    goBackwardInHistory: (
      state: BrowserState,
      action: PayloadAction<TabPayload>
    ) => {
      const { id: tabId } = action.payload
      const tab = tabAdapter.getSelectors().selectById(state.tabs, tabId)
      if (tab === undefined) return
      const tabHistoryState = state.tabHistories[tabId]
      if (tabHistoryState === undefined) return
      const activeHistoryId = tabHistoryState.activeHistoryId
      if (activeHistoryId === undefined) return
      const activeHistoryIndex = tabHistoryState.ids.indexOf(activeHistoryId)
      const previousHistoryId = tabHistoryState.ids[activeHistoryIndex - 1]
      if (previousHistoryId === undefined) return
      tabHistoryState.activeHistoryId = previousHistoryId.toString()
      tabAdapter.updateOne(state.tabs, {
        id: tabId,
        changes: {
          lastVisited: getUnixTime(new Date())
        }
      })
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

export const getLastVisitedTabId = (state: BrowserState): TabId | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tabs)
  if (tabs.length === 0) return undefined
  const lastVisitedTab = getLatestTab(tabs)
  return lastVisitedTab?.id
}

export const getOldestTabIds = (
  state: BrowserState,
  count: number
): TabId[] | undefined => {
  const tabs = tabAdapter.getSelectors().selectAll(state.tabs)
  if (tabs.length === 0) return undefined
  const oldestTabs = getOldestTab(tabs, count)
  return oldestTabs.map(tab => tab.id)
}

export const getLastVisitedTabHistoryId = (
  state: TabHistoryState
): TabId | undefined => {
  const histories = tabHistoryAdapter.getSelectors().selectAll(state)
  if (histories.length === 0) return undefined
  return histories[histories.length - 1]?.id
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
  setActiveTabHistoryId,
  goBackwardInHistory,
  goForwardInHistory
} = browserSlice.actions

export const browserReducer = browserSlice.reducer
