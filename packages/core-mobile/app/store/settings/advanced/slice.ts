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
    },
    toggleLeftHanded: state => {
      state.isLeftHanded = !state.isLeftHanded
    }
  }
})

// selectors
export const selectIsDeveloperMode = (state: RootState) =>
  state.settings.advanced.developerMode

export const selectIsLeftHanded = (state: RootState) =>
  state.settings.advanced.isLeftHanded

// actions
export const { toggleDeveloperMode, toggleLeftHanded } = advancedSlice.actions

export const reloadAccounts = createAction(`${reducerName}/reloadAccounts`)

export const advancedReducer = advancedSlice.reducer
