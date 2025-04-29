import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createHash } from 'utils/createHash'
import { RootState } from 'store/types'
import { getUnixTime } from 'date-fns'
import {
  History,
  HistoryId,
  HistoryState,
  UpdateHistoryPayload
} from '../types'
import { historyAdapter } from '../utils'
import { MAXIMUM_HISTORIES } from '../const'
import { addHistoryForActiveTab } from './tabs'

const reducerName = 'browser/globalHistory'

export const initialState = historyAdapter.getInitialState()

const globalHistorySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    removeAllHistories: (state: HistoryState) => {
      historyAdapter.removeAll(state)
    },
    removeHistory: (
      state: HistoryState,
      action: PayloadAction<{ historyId: HistoryId }>
    ) => {
      historyAdapter.removeOne(state, action.payload.historyId)
    },
    updateMetadataForHistory: (
      state: HistoryState,
      action: PayloadAction<UpdateHistoryPayload>
    ) => {
      const id = action.payload.id
      historyAdapter.updateOne(state, {
        id,
        changes: {
          favicon: action.payload.favicon,
          description: action.payload.description
        }
      })
    }
  },
  extraReducers: builder => {
    builder.addCase(
      addHistoryForActiveTab,
      (state: HistoryState, { payload: history }) => {
        const historyId = createHash(history.url)
        historyAdapter.upsertOne(state, {
          id: historyId,
          lastVisited: getUnixTime(new Date()),
          ...history
        })
        // limit max histories
        if (state.ids.length > MAXIMUM_HISTORIES) {
          const historiesToRemove = historyAdapterSelectors
            .selectIds(state)
            .slice(0, -MAXIMUM_HISTORIES)
          historyAdapter.removeMany(state, historiesToRemove)
        }
      }
    )
  }
})

export const historyAdapterSelectors = historyAdapter.getSelectors()

// selectors
export const selectHistory =
  (id?: HistoryId) =>
  (state: RootState): History | undefined => {
    if (id === undefined) return
    return historyAdapterSelectors.selectById(state.browser.globalHistory, id)
  }

export const selectAllHistories = (state: RootState): History[] => {
  return historyAdapterSelectors.selectAll(state.browser.globalHistory)
}

// actions
export const { removeAllHistories, removeHistory, updateMetadataForHistory } =
  globalHistorySlice.actions

export const globalHistoryReducer = globalHistorySlice.reducer
