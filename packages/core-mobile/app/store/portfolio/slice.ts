import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState, TokenVisibility } from './types'

const reducerName = 'portfolio'

export const portfolioSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleTokenVisibility: (state, action: PayloadAction<string>) => {
      const tokenId = action.payload
      state.tokenVisibility[tokenId] =
        state.tokenVisibility[tokenId] === undefined
          ? false
          : !state.tokenVisibility[tokenId]
    },
    turnOffTokenVisibility: (state, action: PayloadAction<string>) => {
      const tokenId = action.payload
      state.tokenVisibility[tokenId] = false
    }
  }
})

// selectors
export const selectTokenVisilibity = (state: RootState): TokenVisibility =>
  state.portfolio.tokenVisibility

export const selectIsTokenVisible = (tokenId: string) => (state: RootState) =>
  state.portfolio.tokenVisibility[tokenId] !== false

// actions
export const { toggleTokenVisibility, turnOffTokenVisibility } =
  portfolioSlice.actions

export const portfolioReducer = portfolioSlice.reducer
