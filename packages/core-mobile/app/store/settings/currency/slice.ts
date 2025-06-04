import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import {
  currencies,
  CurrencySymbol,
  DEFAULT_CURRENCY,
  initialState
} from './types'

const reducerName = 'currency'

export const currencySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedCurrency: (state, action: PayloadAction<CurrencySymbol>) => {
      state.selected = action.payload
    }
  }
})

// selectors
export const selectSelectedCurrency = (state: RootState): CurrencySymbol => {
  const selectedCurrency = state.settings.currency.selected

  if (
    currencies.findIndex(currency => currency.symbol === selectedCurrency) ===
    -1
  ) {
    return DEFAULT_CURRENCY
  }

  return selectedCurrency
}

// actions
export const { setSelectedCurrency } = currencySlice.actions

export const setCurrencyOnChangeLocale = createAction(
  `${reducerName}/setCurrencyOnChangeLocale`
)

export const currencyReducer = currencySlice.reducer
