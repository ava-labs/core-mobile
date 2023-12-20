import {
  createAction,
  createSlice,
  EntityState,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import { selectHistory } from 'store/browser/slices/globalHistory'
import {
  Tab,
  TabId,
  TabPayload,
  AddHistoryPayload,
  TabState,
  History
} from '../types'
import { limitMaxTabs, tabAdapter, updateActiveTabId } from '../utils'
import { MAXIMUM_TAB_HISTORIES } from '../const'

const reducerName = 'browser/tabs'

export const getInitialState = (): TabState => {
  const tabId = uuidv4()
  return {
    ...({
      ids: [tabId],
      entities: {
        [tabId]: {
          id: tabId,
          historyIds: [],
          activeHistoryIndex: -1
        }
      }
    } as EntityState<Tab>),
    activeTabId: tabId
  }
}

const tabSlice = createSlice({
  name: reducerName,
  initialState: getInitialState,
  reducers: {
    addTab: (state: TabState) => {
      const tabId = uuidv4()
      tabAdapter.addOne(state, {
        id: tabId,
        historyIds: [],
        activeHistoryIndex: -1
      })
      state.activeTabId = tabId
      // limit max tabs
      limitMaxTabs(state)
    },
    addHistoryForActiveTab: (
      state: TabState,
      action: PayloadAction<AddHistoryPayload>
    ) => {
      const history = action.payload
      const lastVisited = getUnixTime(new Date())
      const activeTabId = state.activeTabId
      if (activeTabId === undefined) return
      const tab = tabAdapter.getSelectors().selectById(state, activeTabId)
      if (tab === undefined) return

      const historyId = createHash(history.url)

      //if same as current, skip; useful for multiple loads of same page (by refresh, js, etc..)
      if (tab.historyIds[tab.activeHistoryIndex] === historyId) return

      const newHistory = [
        ...tab.historyIds.slice(0, tab.activeHistoryIndex + 1),
        historyId
      ]

      tabAdapter.updateOne(state, {
        id: activeTabId,
        changes: {
          historyIds: newHistory,
          lastVisited,
          activeHistoryIndex: tab.activeHistoryIndex + 1
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
      Object.assign(state, getInitialState())
    },
    setActiveTabId: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId
    },
    setActiveHistoryForTab: (
      state: TabState,
      action: PayloadAction<Omit<Tab, 'historyIds' | 'lastVisited'>>
    ) => {
      const { id, activeHistoryIndex } = action.payload
      tabAdapter.updateOne(state, {
        id,
        changes: {
          lastVisited: getUnixTime(new Date()),
          activeHistoryIndex
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

export const selectCanGoBack = (state: RootState): boolean => {
  const activeTab = selectActiveTab(state)
  return !!activeTab && activeTab.activeHistoryIndex > 0
}

export const selectCanGoForward = (state: RootState): boolean => {
  const activeTab = selectActiveTab(state)
  return (
    !!activeTab &&
    activeTab.activeHistoryIndex < activeTab.historyIds.length - 1
  )
}

export const selectActiveTab = (state: RootState): Tab | undefined => {
  if (state.browser.tabs.activeTabId === undefined) return
  return tabAdapter
    .getSelectors()
    .selectById(state.browser.tabs, state.browser.tabs.activeTabId)
}

/**
 * Selects currently active history from currently active tab
 */
export const selectActiveHistory = (state: RootState): History | undefined => {
  const activeTab = selectActiveTab(state)
  if (!activeTab || activeTab.activeHistoryIndex < 0) return undefined
  const activeHistoryId = activeTab.historyIds[activeTab.activeHistoryIndex]
  return selectHistory(activeHistoryId)(state)
}

// actions
export const goForward = createAction(`${reducerName}/goForward`)
export const goBackward = createAction(`${reducerName}/goBackward`)

export const {
  addTab,
  addHistoryForActiveTab,
  removeTab,
  removeAllTabs,
  setActiveTabId,
  setActiveHistoryForTab
} = tabSlice.actions

export const tabReducer = tabSlice.reducer
