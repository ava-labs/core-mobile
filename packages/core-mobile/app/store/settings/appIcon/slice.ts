import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { AppIcon, initialState } from './types'

const reducerName = 'appIcon'

export const appIconSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedAppIcon: (state, action: PayloadAction<AppIcon>) => {
      state.selected = action.payload
    }
  }
})

export const selectSelectedAppIcon = (state: RootState): AppIcon => {
  return state.settings.appIcon.selected
}

export const { setSelectedAppIcon } = appIconSlice.actions

export const appIconReducer = appIconSlice.reducer
