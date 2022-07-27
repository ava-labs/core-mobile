import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { NftUID } from 'services/nft/NftService'
import { initialState } from './types'

const reducerName = 'nft'

export const nftSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setHidden: (
      state,
      action: PayloadAction<{
        isHidden: boolean
        tokenUid: NftUID
      }>
    ) => {
      const { isHidden, tokenUid } = action.payload
      if (isHidden) {
        state.hiddenNfts[tokenUid] = true
      } else {
        delete state.hiddenNfts[tokenUid]
      }
    }
  }
})

// selectors
export const selectHiddenNftUIDs = (state: RootState) => state.nft.hiddenNfts

// actions
export const { setHidden } = nftSlice.actions

export const nftReducer = nftSlice.reducer
