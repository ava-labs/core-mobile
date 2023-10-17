import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { advancedReducer as advanced } from './advanced'
import { securityPrivacyReducer as securityPrivacy } from './securityPrivacy'

export default combineReducers({
  currency,
  advanced,
  securityPrivacy
})
