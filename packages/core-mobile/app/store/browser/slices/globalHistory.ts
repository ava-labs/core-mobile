import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createHash } from 'utils/createHash'
import { RootState } from 'store'
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
    updateMetadataForActiveTab: (
      state: HistoryState,
      action: PayloadAction<UpdateHistoryPayload>
    ) => {
      historyAdapter.updateOne(state, {
        id: createHash(action.payload.url),
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
          const historiesToRemove = historyAdapter
            .getSelectors()
            .selectIds(state)
            .slice(0, -MAXIMUM_HISTORIES)
          historyAdapter.removeMany(state, historiesToRemove)
        }
      }
    )
  }
})

// selectors
export const selectHistory =
  (id?: HistoryId) =>
  (state: RootState): History | undefined => {
    if (id === undefined) return
    return historyAdapter
      .getSelectors()
      .selectById(state.browser.globalHistory, id)
  }

export const selectAllHistories = (state: RootState): History[] => {
  return historyAdapter.getSelectors().selectAll(state.browser.globalHistory)
}

// actions
export const { removeAllHistories, removeHistory, updateMetadataForActiveTab } =
  globalHistorySlice.actions

export const globalHistoryReducer = globalHistorySlice.reducer
