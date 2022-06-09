import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { zeroBalanceReducer as zeroBalance } from './zeroBalance'

export default combineReducers({
  currency,
  zeroBalance
})
