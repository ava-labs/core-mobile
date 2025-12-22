import {
  createAction,
  createSlice,
  EntityState,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { getUnixTime } from 'date-fns'
import { createHash } from 'utils/createHash'
import {
  removeAllHistories,
  removeHistory
} from 'store/browser/slices/globalHistory'
import { trimTrailingSlash } from 'utils/string/trimTrailingSlash'
import { uuid } from 'utils/uuid'
import {
  AddHistoryPayload,
  History,
  HistoryId,
  Tab,
  TabId,
  TabPayload,
  TabState
} from '../types'
import {
  limitMaxTabs,
  tabAdapter,
  tabAdapterSelectors,
  updateActiveTabId
} from '../utils'
import { MAXIMUM_TAB_HISTORIES } from '../const'

const reducerName = 'browser/tabs'

export const getInitialState = (): TabState => {
  const tabId = uuid()
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
    } as EntityState<Tab>),
    activeTabId: tabId
  }
}

const tabSlice = createSlice({
  name: reducerName,
  initialState: getInitialState,
  reducers: {
    addTab: (state: TabState) => {
      const tabId = uuid()
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
      const trimmedUrl = trimTrailingSlash(historyPayload.url)
      const historyId = createHash(trimmedUrl)
      const history = {
        id: historyId,
        lastVisited,
        ...historyPayload,
        // Keep the real URL as provided by the WebView to avoid redirect loops,
        // but use a trimmed version for hashing.
        url: historyPayload.url
      } as History
      const activeTabId = state.activeTabId
      if (activeTabId === undefined) return
      const tab = tabAdapterSelectors.selectById(state, activeTabId)
      if (tab === undefined) return

      // If same as current, don't append, but do update metadata.
      if (tab.historyIds[tab.activeHistoryIndex] === historyId) {
        tabAdapter.updateOne(state, {
          id: activeTabId,
          changes: {
            lastVisited,
            activeHistory: history
          }
        })
        return
      }

      // If this URL already exists in this tab's history stack, just move the active index.
      // This keeps Redux aligned with WebView back/forward navigation.
      const existingIndex = tab.historyIds.indexOf(historyId)
      if (existingIndex !== -1) {
        tabAdapter.updateOne(state, {
          id: activeTabId,
          changes: {
            lastVisited,
            activeHistoryIndex: existingIndex,
            activeHistory: history
          }
        })
        return
      }

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
        const trimmedHistoryIds = tab.historyIds.slice(-MAXIMUM_TAB_HISTORIES)
        tabAdapter.updateOne(state, {
          id: activeTabId,
          changes: {
            historyIds: trimmedHistoryIds
          }
        })
      }
    },
    removeTab: (state: TabState, action: PayloadAction<TabPayload>) => {
      const { id: tabId } = action.payload
      tabAdapter.removeOne(state, tabId)

      if (tabAdapterSelectors.selectAll(state).length > 0) {
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
    updateActiveHistoryForTab: (
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
        const allTabs = tabAdapterSelectors.selectAll(state)
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
      const allTabs = tabAdapterSelectors.selectAll(state)
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

// selectors
export const selectIsTabEmpty = (state: RootState): boolean => {
  return (selectActiveTab(state)?.activeHistoryIndex ?? -1) === -1
}

export const selectAllTabs = (state: RootState): Tab[] =>
  tabAdapterSelectors.selectAll(state.browser.tabs)

export const selectTab =
  (tabId: TabId) =>
  (state: RootState): Tab | undefined =>
    tabAdapterSelectors.selectById(state.browser.tabs, tabId)

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
  return activeTab?.activeHistory
}

// actions
export const goForward = createAction(`${reducerName}/goForward`)
export const goBackward = createAction(`${reducerName}/goBackward`)
export const goToDiscoverPage = createAction(`${reducerName}/goToDiscoverPage`)

export const {
  addTab,
  addHistoryForActiveTab,
  removeTab,
  removeAllTabs,
  setActiveTabId,
  updateActiveHistoryForTab
} = tabSlice.actions

export const tabReducer = tabSlice.reducer
