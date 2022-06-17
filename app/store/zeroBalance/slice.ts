import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'zeroBalance'

export const zeroBalanceSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleWhitelist: (state, action: PayloadAction<string>) => {
      const tokenId = action.payload

      if (!state.whitelist.includes(tokenId)) {
        // add to list
        state.whitelist.push(tokenId)
      } else {
        // remove from list
        const newList = state.whitelist.filter(id => id !== tokenId)
        state.whitelist = newList
      }
    }
  }
})

// selectors
export const selectZeroBalanceWhiteList = (state: RootState) =>
  state.zeroBalance.whitelist

export const selectIsZeroBalanceWhiteListed =
  (tokenId: string) => (state: RootState) =>
    state.zeroBalance.whitelist.includes(tokenId)

// actions
export const { toggleWhitelist } = zeroBalanceSlice.actions

export const zeroBalanceReducer = zeroBalanceSlice.reducer
