import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NftUID } from 'services/nft/types'
import { RootState } from 'store'

import { initialState } from './types'

const reducerName = 'nft'

export const nftSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setHidden: (
      state,
      action: PayloadAction<{
        tokenUid: NftUID
      }>
    ) => {
      const { tokenUid } = action.payload
      if (state.hiddenNfts[tokenUid]) {
        delete state.hiddenNfts[tokenUid]
      } else {
        state.hiddenNfts[tokenUid] = true
      }
    }
  }
})

// selectors
export const selectHiddenNftUIDs = (
  state: RootState
): Record<string, boolean> => state.nft.hiddenNfts

// actions
export const { setHidden } = nftSlice.actions

export const nftReducer = nftSlice.reducer
