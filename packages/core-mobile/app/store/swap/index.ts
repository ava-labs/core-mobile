import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { initialState, OngoingSwap } from './types'

const reducerName = 'swap'

const swapSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    updateCurrentSwap: (state, action: PayloadAction<OngoingSwap>) => {
      state.currentSwap = action.payload
    }
  }
})

// selectors
export const selectCurrentSwap = (state: RootState): OngoingSwap =>
  state.swap.currentSwap

// actions
export const { updateCurrentSwap } = swapSlice.actions

export default swapSlice.reducer
