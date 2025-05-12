import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { CollectibleVisibility, initialState, TokenVisibility } from './types'

const reducerName = 'portfolio'

export const portfolioSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleTokenVisibility: (
      state,
      action: PayloadAction<{ tokenId: string }>
    ) => {
      const { tokenId } = action.payload

      if (state.tokenVisibility?.[tokenId.toLowerCase()] != null) {
        state.tokenVisibility[tokenId.toLowerCase()] =
          !state.tokenVisibility[tokenId.toLowerCase()]
      } else {
        state.tokenVisibility[tokenId.toLowerCase()] = false
      }
    },
    toggleCollectibleVisibility: (
      state,
      action: PayloadAction<{ uid: string }>
    ) => {
      const { uid } = action.payload

      if (state.collectibleVisibility?.[uid.toLowerCase()] != null) {
        state.collectibleVisibility[uid.toLowerCase()] =
          !state.collectibleVisibility?.[uid.toLowerCase()]
      } else {
        state.collectibleVisibility[uid.toLowerCase()] = false
      }
    },
    toggleCollectibleUnprocessableVisibility: state => {
      state.collectibleUnprocessableVisibility =
        !state.collectibleUnprocessableVisibility || false
    }
  }
})

// selectors
export const selectTokenVisibility = (state: RootState): TokenVisibility =>
  state.portfolio.tokenVisibility

export const selectCollectibleVisibility = (
  state: RootState
): CollectibleVisibility => state.portfolio.collectibleVisibility

export const selectCollectibleUnprocessableVisibility = (
  state: RootState
): boolean => state.portfolio.collectibleUnprocessableVisibility

// actions
export const {
  toggleTokenVisibility,
  toggleCollectibleVisibility,
  toggleCollectibleUnprocessableVisibility
} = portfolioSlice.actions

export const portfolioReducer = portfolioSlice.reducer
