import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { IndexPath } from '@avalabs/k2-alpine'
import { initialState } from './types'

const reducerName = 'assets'

export const assetsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<IndexPath>) => {
      state.filter = action.payload
    },
    setSort: (state, action: PayloadAction<IndexPath>) => {
      state.sort = action.payload
    },
    setView: (state, action: PayloadAction<IndexPath>) => {
      state.view = action.payload
    }
  }
})

// selectors
export const selectAssetsFilter = (state: RootState): IndexPath =>
  state.assets.filter

export const selectAssetsSort = (state: RootState): IndexPath =>
  state.assets.sort

export const selectAssetsView = (state: RootState): IndexPath =>
  state.assets.view

// actions
export const { setFilter, setSort, setView } = assetsSlice.actions

export const assetsReducer = assetsSlice.reducer
