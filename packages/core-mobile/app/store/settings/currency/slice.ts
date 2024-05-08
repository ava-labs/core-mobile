import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { currencies, DEFAULT_CURRENCY, initialState } from './types'

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
const selectedCurrency = (state: RootState): string =>
  state.settings.currency.selected

export const selectSelectedCurrency = createSelector(
  [selectedCurrency],
  curr => {
    if (currencies.findIndex(currency => currency.symbol === curr) === -1) {
      return DEFAULT_CURRENCY
    }
    return curr
  }
)

// actions
export const { setSelectedCurrency } = currencySlice.actions

export const currencyReducer = currencySlice.reducer
