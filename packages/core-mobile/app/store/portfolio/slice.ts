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
      action: PayloadAction<{ tokenId: string; value: boolean }>
    ) => {
      const { tokenId, value } = action.payload
      state.tokenVisibility[tokenId] = value
    }
  }
})

// selectors
export const selectTokenVisilibity = (state: RootState): TokenVisibility =>
  state.portfolio.tokenVisibility

export const selectIsTokenVisible = (tokenId: string) => (state: RootState) =>
  state.portfolio.tokenVisibility[tokenId] !== false

// actions
export const { toggleTokenVisibility } = portfolioSlice.actions

export const portfolioReducer = portfolioSlice.reducer
