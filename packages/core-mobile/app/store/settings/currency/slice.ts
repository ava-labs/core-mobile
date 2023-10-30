import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'currency'

export const currencySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedCurrency: (state, action: PayloadAction<string>) => {
      state.selected = action.payload
    }
  }
})

// selectors
export const selectSelectedCurrency = (state: RootState) =>
  state.settings.currency.selected

export const selectCurrencies = (state: RootState) =>
  state.settings.currency.currencies

// actions
export const { setSelectedCurrency } = currencySlice.actions

export const currencyReducer = currencySlice.reducer
