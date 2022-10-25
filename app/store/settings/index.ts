import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { advancedReducer as advanced } from './advanced'
import { remoteReducer as remote } from './remote'

export default combineReducers({
  currency,
  remote,
  advanced
})
