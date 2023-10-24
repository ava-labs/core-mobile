import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'portfolio'

export const portfolioSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleBlacklist: (state, action: PayloadAction<string>) => {
      const tokenId = action.payload

      if (!state.tokenBlacklist.includes(tokenId)) {
        // add to list
        state.tokenBlacklist.push(tokenId)
      } else {
        // remove from list
        const newList = state.tokenBlacklist.filter(id => id !== tokenId)
        state.tokenBlacklist = newList
      }
    }
  }
})

// selectors
export const selectTokenBlacklist = (state: RootState) =>
  state.portfolio.tokenBlacklist

export const selectIsTokenBlacklisted =
  (tokenId: string) => (state: RootState) =>
    state.portfolio.tokenBlacklist.includes(tokenId)

// actions
export const { toggleBlacklist } = portfolioSlice.actions

export const portfolioReducer = portfolioSlice.reducer
