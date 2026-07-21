import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import {
  DEFAULT_LANGUAGE,
  initialState,
  SUPPORTED_LANGUAGE_CODES
} from './types'

const reducerName = 'language'

export const languageSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedLanguage: (state, action: PayloadAction<string>) => {
      // clamp at the reducer boundary so state can never hold an unsupported
      // code (the selector clamps on read; this clamps on write)
      state.selected = SUPPORTED_LANGUAGE_CODES.includes(action.payload)
        ? action.payload
        : DEFAULT_LANGUAGE
    }
  }
})

// selectors
export const selectSelectedLanguage = (state: RootState): string => {
  const selected = state.settings.language.selected
  return SUPPORTED_LANGUAGE_CODES.includes(selected)
    ? selected
    : DEFAULT_LANGUAGE
}

// actions
export const { setSelectedLanguage } = languageSlice.actions

export const languageReducer = languageSlice.reducer
