import { combineReducers } from '@reduxjs/toolkit'
import { currencyReducer as currency } from './currency'
import { advancedReducer as advanced } from './advanced'
import { securityPrivacyReducer as securityPrivacy } from './securityPrivacy'
import { appearanceReducer as appearance } from './appearance'
import { avatarReducer as avatar } from './avatar'
export default combineReducers({
  currency,
  advanced,
  securityPrivacy,
  appearance,
  avatar
})
