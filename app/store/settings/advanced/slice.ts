import { createAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'advanced'

export const advancedSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleDeveloperMode: state => {
      state.developerMode = !state.developerMode
    }
  }
})

// selectors
export const selectIsDeveloperMode = (state: RootState) =>
  state.settings.advanced.developerMode

// actions
export const { toggleDeveloperMode } = advancedSlice.actions

export const reloadAccounts = createAction(`${reducerName}/reloadAccounts`)

export const advancedReducer = advancedSlice.reducer
