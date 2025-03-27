import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { Appearance, initialState } from './types'

const reducerName = 'appearance'

export const appearanceSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedAppearance: (state, action: PayloadAction<Appearance>) => {
      state.selected = action.payload
    }
  }
})

// selectors
export const selectSelectedAppearance = (state: RootState): Appearance => {
  return state.settings.appearance.selected
}

// actions
export const { setSelectedAppearance } = appearanceSlice.actions

export const appearanceReducer = appearanceSlice.reducer
