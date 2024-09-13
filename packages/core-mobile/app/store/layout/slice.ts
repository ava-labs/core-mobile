import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import type { LayoutState } from './types'

export const reducerName = 'app'

export const initialState: LayoutState = {
  mainTopInset: 0
}

export const layoutSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setMainTopInset: (state, action: PayloadAction<number>) => {
      state.mainTopInset = action.payload
    }
  }
})

// selectors
export const selectMainTopInset = (state: RootState): number =>
  state.layout.mainTopInset

export const { setMainTopInset } = layoutSlice.actions

export const layoutReducer = layoutSlice.reducer
