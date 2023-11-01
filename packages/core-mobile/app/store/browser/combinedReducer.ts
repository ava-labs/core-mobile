import { combineReducers } from '@reduxjs/toolkit'
import { tabReducer as tabs } from './slices/tabs'
import { globalHistoryReducer as globalHistory } from './slices/globalHistory'
import { favoriteReducer as favorites } from './slices/favorites'

export const combinedReducer = combineReducers({
  tabs,
  globalHistory,
  favorites
})
