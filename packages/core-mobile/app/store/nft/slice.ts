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
          ...existing,
          ...nft
        }
      })
    },
    updateExistingNfts: (
      state,
      action: PayloadAction<{
        nfts: NFTItemData[]
      }>
    ) => {
      const { nfts } = action.payload
      nfts.forEach(nft => {
        const nftUID = getNftUID(nft)
        const existing = state.nfts[nftUID]
        if (existing) {
          state.nfts[nftUID] = {
            ...existing,
            ...nft
          }
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
export const selectNfts = (state: RootState) => Object.values(state.nft.nfts)

// actions
export const { setHidden, saveNfts, clearNfts, updateExistingNfts } =
  nftSlice.actions

export const nftReducer = nftSlice.reducer
