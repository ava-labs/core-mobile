import { createAction, createSlice } from '@reduxjs/toolkit'
import { createHash } from 'utils/createHash'
import { RootState } from 'store'
import { History, HistoryId, HistoryState } from '../types'
import { historyAdapter } from '../utils'
import { MAXIMUM_HISTORIES } from '../const'
import { addHistoryForActiveTab } from './tabs'

const reducerName = 'browser/globalHistory'

const initialState = historyAdapter.getInitialState()

const globalHistorySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(
      addHistoryForActiveTab,
      (state: HistoryState, { payload: history }) => {
        const historyId = createHash(history.url)
        historyAdapter.upsertOne(state, {
          id: historyId,
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
export const removeAllHistories = createAction(
  `${reducerName}/removeAllHistories`
)
export const removeHistory = createAction<{ historyId: HistoryId }>(
  `${reducerName}/removeHistory`
)

export const globalHistoryReducer = globalHistorySlice.reducer
