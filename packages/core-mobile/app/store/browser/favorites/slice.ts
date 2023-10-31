import {
  createEntityAdapter,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { v4 as uuidv4 } from 'uuid'
import {
  FavoriteState,
  FavoriteId,
  Favorite
} from 'store/browser/favorites/types'

const reducerName = 'browser-favorites'

export const favoriteAdapter = createEntityAdapter<Favorite>({
  selectId: favorite => favorite.id
})

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
export const selectAllFavorites = (state: RootState): Favorite[] =>
  favoriteAdapter.getSelectors().selectAll(state.browserFavorites)

// actions
export const { removeFavorite, addFavorite, clearAll } = favoriteSlice.actions

export const favoriteReducer = favoriteSlice.reducer
