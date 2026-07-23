import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import {
  DEFAULT_LANGUAGE,
  initialState,
  isLanguageCode,
  LanguageCode
} from './types'

const reducerName = 'language'

export const languageSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedLanguage: (state, action: PayloadAction<string>) => {
      // payload is `string` — this is the untrusted write boundary. Clamp so
      // state can only ever hold a LanguageCode (the selector clamps on read;
      // this clamps on write).
      state.selected = isLanguageCode(action.payload)
        ? action.payload
        : DEFAULT_LANGUAGE
    }
  }
})

// selectors
export const selectSelectedLanguage = (state: RootState): LanguageCode => {
  // redux-persist rehydrates `selected` from disk as untrusted data, so narrow
  // on read rather than trusting the declared type.
  const selected = state.settings.language.selected
  return isLanguageCode(selected) ? selected : DEFAULT_LANGUAGE
}

// actions
export const { setSelectedLanguage } = languageSlice.actions

export const languageReducer = languageSlice.reducer
