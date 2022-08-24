import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NftUID } from 'services/nft/types'
import { RootState } from 'store'

import { getNftUID } from 'services/nft/utils'
import { initialState, NFTItemData } from './types'

const reducerName = 'nft'

export const nftSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    clearNfts: state => {
      state.nfts = {}
    },
    saveNfts: (
      state,
      action: PayloadAction<{
        nfts: NFTItemData[]
      }>
    ) => {
      const { nfts } = action.payload
      nfts.forEach(nft => {
        const nftUID = getNftUID(nft)
        const existing = state.nfts[nftUID]
        state.nfts[nftUID] = {
          ...nft,
          ...existing
        }
      })
    },
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
export const selectHiddenNftUIDs = (state: RootState) => state.nft.hiddenNfts

// actions
export const { setHidden, saveNfts, clearNfts } = nftSlice.actions

export const nftReducer = nftSlice.reducer
