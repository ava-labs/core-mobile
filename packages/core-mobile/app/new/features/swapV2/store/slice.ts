import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'

export interface FusionState {
  isFusionServiceReady: boolean
}

const initialState: FusionState = {
  isFusionServiceReady: false
}

const reducerName = 'fusion'

export const fusionSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setFusionServiceReady: (state, action: PayloadAction<boolean>) => {
      state.isFusionServiceReady = action.payload
    }
  }
})

// Actions
export const { setFusionServiceReady } = fusionSlice.actions

// Selectors
export const selectIsFusionServiceReady = (state: RootState): boolean =>
  state.fusion.isFusionServiceReady

// Reducer
export const fusionReducer = fusionSlice.reducer
