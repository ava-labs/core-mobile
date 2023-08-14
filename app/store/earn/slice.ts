import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { EarnState } from 'store/earn/types'

const reducerName = 'earn'

const initialState = {
  atomicImportFailed: false
} as EarnState

const earnSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setAtomicImportFailed: (state, action: PayloadAction<boolean>) => {
      state.atomicImportFailed = action.payload
    }
  }
})
//actions
export const { setAtomicImportFailed } = earnSlice.actions

// selectors
export const selectAtomicImportFailed = (state: RootState) =>
  state.earn.atomicImportFailed

export const earnReducer = earnSlice.reducer
