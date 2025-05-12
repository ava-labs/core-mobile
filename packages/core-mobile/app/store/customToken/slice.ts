import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { NetworkContractToken } from '@avalabs/vm-module-types'
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
export const selectAllCustomTokens = (
  state: RootState
): { [chainId: string]: NetworkContractToken[] } => state.customToken.tokens

// actions
export const { addCustomToken } = customTokenSlice.actions

export const customTokenReducer = customTokenSlice.reducer
