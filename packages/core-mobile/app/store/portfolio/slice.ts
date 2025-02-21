import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState, TokenVisibility } from './types'

const reducerName = 'portfolio'

export const portfolioSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleTokenVisibility: (
      state,
      action: PayloadAction<{ tokenId: string }>
    ) => {
      const { tokenId } = action.payload
      state.tokenVisibility[tokenId.toLowerCase()] =
        !state.tokenVisibility[tokenId.toLowerCase()]
    }
  }
})

// selectors
export const selectTokenVisibility = (state: RootState): TokenVisibility =>
  state.portfolio.tokenVisibility

// actions
export const { toggleTokenVisibility } = portfolioSlice.actions

export const portfolioReducer = portfolioSlice.reducer
