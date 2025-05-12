import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NftLocalId } from 'services/nft/types'
import { RootState } from 'store/types'

import { initialState } from './types'

const reducerName = 'nft'

export const nftSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setHidden: (
      state,
      action: PayloadAction<{
        localId: NftLocalId
      }>
    ) => {
      const { localId } = action.payload
      if (state.hiddenNfts[localId]) {
        delete state.hiddenNfts[localId]
      } else {
        state.hiddenNfts[localId] = true
      }
    }
  }
})

// selectors
export const selectHiddenNftLocalIds = (
  state: RootState
): Record<string, boolean> => state.nft.hiddenNfts

// actions
export const { setHidden } = nftSlice.actions

export const nftReducer = nftSlice.reducer
