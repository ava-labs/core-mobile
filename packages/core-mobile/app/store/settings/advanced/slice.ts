import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { initialState } from './types'

const reducerName = 'advanced'

export const advancedSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleDeveloperMode: state => {
      state.developerMode = !state.developerMode
    },
    setIsDeveloperMode: (state, action: PayloadAction<boolean>) => {
      state.developerMode = action.payload
    },
    toggleLeftHanded: state => {
      state.isLeftHanded = !state.isLeftHanded
    }
  }
})

// selectors
export const selectIsDeveloperMode = (state: RootState): boolean =>
  state.settings.advanced.developerMode

export const selectIsLeftHanded = (state: RootState): boolean =>
  state.settings.advanced.isLeftHanded

// actions
export const { toggleDeveloperMode, toggleLeftHanded, setIsDeveloperMode } =
  advancedSlice.actions

export const advancedReducer = advancedSlice.reducer
