import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'assets'

// currently we don't support importing from k2-alpine from outside app/new folder
type IndexPath = {
  section: number
  row: number
}

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
