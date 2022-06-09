import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { SettingsState, currencyInitialState } from './types'

const reducerName = 'settings'

const initialState: SettingsState = {
  currency: currencyInitialState
}

export const settingsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedCurrency: (state, action: PayloadAction<string>) => {
      state.currency.selected = action.payload
    }
  }
})

// selectors
export const selectSelectedCurrency = (state: RootState) =>
  state.settings.currency.selected

export const selectCurrencies = (state: RootState) =>
  state.settings.currency.currencies

// actions
export const { setSelectedCurrency } = settingsSlice.actions

export default settingsSlice.reducer
