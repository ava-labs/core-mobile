import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import {
  FavoriteState,
  FavoriteId,
  Favorite,
  BrowserState
} from 'store/browser/types'
import { favoriteAdapter } from '../utils'

const reducerName = 'browserFavorites'

const initialState: FavoriteState = favoriteAdapter.getInitialState()

const favoriteSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<Favorite>) => {
      const newFavorite = action.payload
      newFavorite.id = uuidv4()
      favoriteAdapter.addOne(state, newFavorite)
    },
    removeFavorite: (state, action: PayloadAction<FavoriteId>) => {
      const favoriteIdToRemove = action.payload
      favoriteAdapter.removeOne(state, favoriteIdToRemove)
    },
    clearAll: state => favoriteAdapter.removeAll(state)
  }
})

// selectors
export const selectAllFavorites = (state: BrowserState): Favorite[] =>
  favoriteAdapter.getSelectors().selectAll(state.favorites)

// actions
export const { removeFavorite, addFavorite, clearAll } = favoriteSlice.actions

export const favoriteReducer = favoriteSlice.reducer
