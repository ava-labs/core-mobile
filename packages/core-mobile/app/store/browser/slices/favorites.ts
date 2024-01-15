import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FavoriteState, Favorite, HistoryId } from 'store/browser/types'
import { createHash } from 'utils/createHash'
import { RootState } from 'store'
import { favoriteAdapter } from '../utils'

const reducerName = 'browser/favorites'

export const initialState: FavoriteState = favoriteAdapter.getInitialState()

const favoriteSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<Omit<Favorite, 'id'>>) => {
      const id = createHash(action.payload.url)
      favoriteAdapter.addOne(state, { ...action.payload, id })
    },
    removeFavorite: (state, action: PayloadAction<{ url: string }>) => {
      const id = createHash(action.payload.url)
      favoriteAdapter.removeOne(state, id)
    },
    clearAll: state => favoriteAdapter.removeAll(state)
  }
})

// selectors
export const selectAllFavorites = (state: RootState): Favorite[] =>
  favoriteAdapter.getSelectors().selectAll(state.browser.favorites)

export const selectIsFavorited =
  (id?: HistoryId) =>
  (state: RootState): boolean => {
    if (id === undefined) return false
    return (
      favoriteAdapter.getSelectors().selectById(state.browser.favorites, id) !==
      undefined
    )
  }

// actions
export const { removeFavorite, addFavorite, clearAll } = favoriteSlice.actions

export const favoriteReducer = favoriteSlice.reducer
