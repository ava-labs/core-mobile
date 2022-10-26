import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { advancedReducer as advanced } from './advanced'

export default combineReducers({
  currency,
  advanced
})
