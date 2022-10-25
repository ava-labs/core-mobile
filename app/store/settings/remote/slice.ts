import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'remote'

export const remoteSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSentrySampleRate: (state, action: PayloadAction<string>) => {
      state.sentrySampleRate = parseInt(action.payload) / 100
    }
  }
})

// selectors
export const selectSentrySampleRate = (state: RootState) =>
  state.settings.remote.sentrySampleRate

// actions
export const { setSentrySampleRate } = remoteSlice.actions

export const remoteReducer = remoteSlice.reducer
