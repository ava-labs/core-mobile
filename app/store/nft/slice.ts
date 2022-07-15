import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState, NFTItemData } from './types'

const reducerName = 'nft'

export const nftSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    saveNFT: (
      state,
      action: PayloadAction<{
        chainId: number
        address: string
        token: NFTItemData
      }>
    ) => {
      const { chainId, address, token } = action.payload
      if (!state.collection[chainId]) {
        state.collection[chainId] = {}
      }
      if (!state.collection[chainId][address]) {
        state.collection[chainId][address] = {}
      }
      const existing = state.collection[chainId][address][token.uid]
      if (existing) {
        token.owner = existing.owner
        token.isShowing = existing.isShowing
        token.aspect = existing.aspect
        token.uid = existing.uid
        token.isSvg = existing.isSvg
      }
      state.collection[chainId][address][token.uid] = token
    }
  }
})

// selectors
export const selectNftCollection =
  (chainId: number, address: string) => (state: RootState) =>
    Object.values(state.nft.collection[chainId]?.[address] ?? [])

// actions
export const { saveNFT } = nftSlice.actions
export const fetchNfts = createAction<{ chainId: number; address: string }>(
  `${reducerName}/fetchNfts`
)

export const nftReducer = nftSlice.reducer
