import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { zeroBalanceReducer as zeroBalance } from './zeroBalance'
import { advancedReducer as advanced } from './advanced'

export default combineReducers({
  currency,
  zeroBalance,
  advanced
})
