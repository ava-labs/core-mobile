import {
  createAction,
  createSelector,
  createSlice,
  EntityId,
  EntityState,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import {
  removeAllHistories,
  removeHistory
} from 'store/browser/slices/globalHistory'
import { trimTrailingSlash } from 'utils/string/trimTrailingSlash'
import {
  AddHistoryPayload,
  History,
  HistoryId,
  Tab,
  TabId,
  TabPayload,
  TabState
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
          activeHistoryIndex: -1,
          lastVisited: getUnixTime(new Date())
        }
      }
    } as EntityState<Tab, EntityId>),
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
      const lastVisited = getUnixTime(new Date())

      const historyPayload = action.payload
      historyPayload.url = trimTrailingSlash(historyPayload.url)
      const historyId = createHash(historyPayload.url)
      const history = {
        id: historyId,
        lastVisited,
        ...historyPayload
      } as History
      const activeTabId = state.activeTabId
      if (activeTabId === undefined) return
      const tab = tabAdapter.getSelectors().selectById(state, activeTabId)
      if (tab === undefined) return

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
          activeHistoryIndex: tab.activeHistoryIndex + 1,
          activeHistory: history
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

      if (tabAdapter.getSelectors().selectAll(state).length > 0) {
        // update active tab id
        updateActiveTabId(state, tabId)
      } else {
        Object.assign(state, getInitialState())
      }
    },
    removeAllTabs: (state: TabState) => {
      tabAdapter.removeAll(state)
      Object.assign(state, getInitialState())
    },
    setActiveTabId: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      state.activeTabId = tabId

      // update last visited when active tab is changed
      const entity = state.entities[tabId]
      if (entity) {
        entity.lastVisited = getUnixTime(new Date())
      }
    },
    setActiveHistoryForTab: (
      state: TabState,
      action: PayloadAction<Omit<Tab, 'historyIds' | 'lastVisited'>>
    ) => {
      const { id, activeHistoryIndex, activeHistory } = action.payload
      tabAdapter.updateOne(state, {
        id,
        changes: {
          lastVisited: getUnixTime(new Date()),
          activeHistoryIndex,
          activeHistory
        }
      })
    }
  },
  extraReducers: builder => {
    builder.addCase(
      removeHistory,
      (state: TabState, action: PayloadAction<{ historyId: HistoryId }>) => {
        //remove that history item from all tabs
        const allTabs = tabAdapter.getSelectors().selectAll(state)
        allTabs.forEach(tab => {
          let historyIds = tab.historyIds.filter(
            id => id !== action.payload.historyId
          )
          const activeHistoryIndex = historyIds.indexOf(
            tab.activeHistory?.id ?? 'undefined'
          )
          if (activeHistoryIndex === -1) {
            //we removed history which is currently active on this tab; let's remove all history items for that tab
            historyIds = []
          }
          tabAdapter.updateOne(state, {
            id: tab.id,
            changes: {
              historyIds,
              activeHistoryIndex
            }
          })
        })
      }
    )
    builder.addCase(removeAllHistories, (state: TabState) => {
      const allTabs = tabAdapter.getSelectors().selectAll(state)
      allTabs.forEach(tab => {
        tabAdapter.updateOne(state, {
          id: tab.id,
          changes: {
            historyIds: [],
            activeHistoryIndex: -1
          }
        })
      })
    })
  }
})

const selectTabs = (state: RootState): EntityState<Tab, EntityId> =>
  state.browser.tabs

const activeTabId = (state: RootState): TabId | undefined =>
  state.browser.tabs.activeTabId

// selectors
export const selectAllTabs = createSelector([selectTabs], tabs => {
  return tabAdapter.getSelectors().selectAll(tabs)
})

export const selectTab =
  (tabId: TabId) =>
  (state: RootState): Tab | undefined =>
    tabAdapter.getSelectors().selectById(state.browser.tabs, tabId)

export const selectCanGoForward = (state: RootState): boolean => {
  const activeTab = selectActiveTab(state)
  return (
    !!activeTab &&
    activeTab.activeHistoryIndex < activeTab.historyIds.length - 1
  )
}

export const selectActiveTab = createSelector(
  [selectTabs, activeTabId],
  (tabs, activeId) => {
    if (activeId === undefined) return
    return tabAdapter.getSelectors().selectById(tabs, activeId)
  }
)

export const selectIsTabEmpty = createSelector([selectActiveTab], activeTab => {
  return (activeTab?.activeHistoryIndex ?? -1) === -1
})

export const selectCanGoBack = createSelector([selectActiveTab], activeTab => {
  return !!activeTab && activeTab.activeHistoryIndex >= 0
})

/**
 * Selects currently active history from currently active tab
 */
export const selectActiveHistory = createSelector(
  [selectActiveTab],
  activeTab => {
    return activeTab?.activeHistory
  }
)

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
