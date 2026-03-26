import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from 'store/types'
import type { KycStatus, MarketSummary } from '../types'

// Minimal Quote shape from SDK (maxBidPrice / minAskPrice are decimal strings)
export type ActiveQuote = {
  maxBidPrice: string
  minAskPrice: string
}

// Minimal Position shape — enough to track which bet the user has open
export type ActivePosition = {
  tickerId: string
  outcome: 'YES' | 'NO'
}

type PredictionsState = {
  markets: MarketSummary[]
  kycStatus: KycStatus
  activeQuote: ActiveQuote | null
  activePosition: ActivePosition | null
}

export const initialState: PredictionsState = {
  markets: [],
  kycStatus: 'idle',
  activeQuote: null,
  activePosition: null
}

export const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    setMarkets: (state, action: PayloadAction<MarketSummary[]>) => {
      state.markets = action.payload
    },
    setKycStatus: (state, action: PayloadAction<KycStatus>) => {
      state.kycStatus = action.payload
    },
    setActiveQuote: (state, action: PayloadAction<ActiveQuote>) => {
      state.activeQuote = action.payload
    },
    clearActiveQuote: state => {
      state.activeQuote = null
    },
    setActivePosition: (state, action: PayloadAction<ActivePosition>) => {
      state.activePosition = action.payload
    },
    clearActivePosition: state => {
      state.activePosition = null
    }
  }
})

export const {
  setMarkets,
  setKycStatus,
  setActiveQuote,
  clearActiveQuote,
  setActivePosition,
  clearActivePosition
} = predictionsSlice.actions

export const predictionsReducer = predictionsSlice.reducer

export const selectMarkets = (state: RootState): MarketSummary[] =>
  state.predictions.markets

export const selectKycStatus = (state: RootState): KycStatus =>
  state.predictions.kycStatus

export const selectActiveQuote = (state: RootState): ActiveQuote | null =>
  state.predictions.activeQuote

export const selectActivePosition = (state: RootState): ActivePosition | null =>
  state.predictions.activePosition
