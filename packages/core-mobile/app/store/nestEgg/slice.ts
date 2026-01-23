import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { NestEggState } from './types'

export const initialState: NestEggState = {
  hasSeenCampaign: false,
  hasQualified: false,
  qualifiedAt: null,
  qualifyingTxHash: null,
  hasAcknowledgedQualification: false
}

const nestEggSlice = createSlice({
  name: 'nestEgg',
  initialState,
  reducers: {
    setHasSeenCampaign: (state, action: PayloadAction<boolean>) => {
      state.hasSeenCampaign = action.payload
    },
    setQualified: (
      state,
      action: PayloadAction<{ txHash: string; timestamp: number }>
    ) => {
      state.hasQualified = true
      state.qualifiedAt = action.payload.timestamp
      state.qualifyingTxHash = action.payload.txHash
    },
    setHasAcknowledgedQualification: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.hasAcknowledgedQualification = action.payload
    },
    resetNestEggState: () => initialState
  }
})

// Selectors
export const selectHasSeenNestEggCampaign = (state: RootState): boolean =>
  state.nestEgg.hasSeenCampaign

export const selectHasQualifiedForNestEgg = (state: RootState): boolean =>
  state.nestEgg.hasQualified

export const selectNestEggQualifiedAt = (state: RootState): number | null =>
  state.nestEgg.qualifiedAt

export const selectNestEggQualifyingTxHash = (
  state: RootState
): string | null => state.nestEgg.qualifyingTxHash

export const selectHasAcknowledgedNestEggQualification = (
  state: RootState
): boolean => state.nestEgg.hasAcknowledgedQualification

// Check if user is eligible to see the campaign modal
// (hasn't seen it before, hasn't already qualified)
export const selectIsEligibleForNestEggCampaignModal = (
  state: RootState
): boolean => {
  return !state.nestEgg.hasSeenCampaign && !state.nestEgg.hasQualified
}

// Check if user should see success modal
// (has qualified but hasn't acknowledged)
export const selectShouldShowNestEggSuccessModal = (
  state: RootState
): boolean => {
  return (
    state.nestEgg.hasQualified && !state.nestEgg.hasAcknowledgedQualification
  )
}

// Actions
export const {
  setHasSeenCampaign,
  setQualified,
  setHasAcknowledgedQualification,
  resetNestEggState
} = nestEggSlice.actions

export const nestEggReducer = nestEggSlice.reducer
