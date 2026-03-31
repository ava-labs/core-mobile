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
      const normalizedAddress = token.address.toLowerCase()
      const normalizedToken = { ...token, address: normalizedAddress }

      if (!state.tokens[chainId]) state.tokens[chainId] = []

      const alreadyExists = state.tokens[chainId]?.some(
        t => t.address.toLowerCase() === normalizedAddress
      )
      if (alreadyExists) return

      state.tokens[chainId]?.push(normalizedToken)
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
