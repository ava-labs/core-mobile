import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  FavoriteState,
  Favorite,
  HistoryId,
  UpdateFavoritePayload
} from 'store/browser/types'
import { createHash } from 'utils/createHash'
import { RootState } from 'store/types'
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
    updateFavorite: (state, action: PayloadAction<UpdateFavoritePayload>) => {
      const { id, favicon, description, title } = action.payload
      favoriteAdapter.updateOne(state, {
        id,
        changes: {
          favicon,
          description,
          title
        }
      })
    },
    clearAll: state => favoriteAdapter.removeAll(state)
  }
})

// selectors
const favoriteAdapterSelectors = favoriteAdapter.getSelectors()
export const selectAllFavorites = (state: RootState): Favorite[] =>
  favoriteAdapterSelectors.selectAll(state.browser.favorites)

export const selectIsFavorited =
  (id?: HistoryId) =>
  (state: RootState): boolean => {
    if (id === undefined) return false
    return (
      favoriteAdapterSelectors.selectById(state.browser.favorites, id) !==
      undefined
    )
  }

// actions
export const { removeFavorite, addFavorite, updateFavorite, clearAll } =
  favoriteSlice.actions

export const favoriteReducer = favoriteSlice.reducer
