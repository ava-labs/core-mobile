import { NetworkContractToken } from '@avalabs/chains-sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'customToken'

export const customTokenSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addCustomToken: (
      state,
      action: PayloadAction<{ chainId: number; token: NetworkContractToken }>
    ) => {
      const { chainId, token } = action.payload

      if (!state.tokens[chainId]) state.tokens[chainId] = []

      state.tokens[chainId]?.push(token)
    }
  }
})

// selectors
export const selectAllCustomTokens = (state: RootState) =>
  state.customToken.tokens

// actions
export const { addCustomToken } = customTokenSlice.actions

export const customTokenReducer = customTokenSlice.reducer
