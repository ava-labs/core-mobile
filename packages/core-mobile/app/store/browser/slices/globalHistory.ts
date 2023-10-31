import { createSlice } from '@reduxjs/toolkit'
import { createHash } from 'utils/createHash'
import { HistoryState } from '../types'
import { historyAdapter } from '../utils'
import { MAXIMUM_HISTORIES } from '../const'
import { addHistoryForTab } from './tabs'

const reducerName = 'browser-global-history'

const initialState = historyAdapter.getInitialState()

const globalHistorySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(addHistoryForTab, (state: HistoryState, { payload }) => {
      const { history } = payload
      const historyId = createHash(history.url)
      historyAdapter.upsertOne(state, {
        id: historyId,
        ...payload.history
      })
      // limit max histories
      if (state.ids.length > MAXIMUM_HISTORIES) {
        const historiesToRemove = historyAdapter
          .getSelectors()
          .selectIds(state)
          .slice(0, -MAXIMUM_HISTORIES)
        historyAdapter.removeMany(state, historiesToRemove)
      }
    })
  }
})

export const globalHistoryReducer = globalHistorySlice.reducer
