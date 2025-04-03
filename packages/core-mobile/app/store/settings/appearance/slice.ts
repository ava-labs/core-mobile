import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { ColorSchemeName } from 'react-native'
import { Appearance, initialState } from './types'

const reducerName = 'appearance'

export const appearanceSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedAppearance: (state, action: PayloadAction<Appearance>) => {
      state.selected = action.payload
    },
    setSelectedColorScheme: (state, action: PayloadAction<ColorSchemeName>) => {
      state.colorScheme = action.payload
    }
  }
})

// selectors
export const selectSelectedAppearance = (state: RootState): Appearance => {
  return state.settings.appearance.selected
}

export const selectSelectedColorScheme = (
  state: RootState
): ColorSchemeName => {
  return state.settings.appearance.colorScheme
}

// actions
export const { setSelectedAppearance, setSelectedColorScheme } =
  appearanceSlice.actions

export const appearanceReducer = appearanceSlice.reducer
