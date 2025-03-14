import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'securityPrivacy'

export const securityPrivacySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setCoreAnalytics: (state, action: PayloadAction<boolean | undefined>) => {
      state.coreAnalytics = action.payload
    },
    /**
     * Set Terms of use and Privacy policy consent
     */
    setTouAndPpConsent: (state, action: PayloadAction<boolean>) => {
      state.consentToTOUnPP = action.payload
    },
    toggleBalanceVisibility: state => {
      state.balanceVisibility = !state.balanceVisibility
    }
  }
})

// selectors
export const selectCoreAnalyticsConsent = (
  state: RootState
): boolean | undefined => state.settings.securityPrivacy.coreAnalytics

/**
 * Select Terms of use and Privacy policy consent
 * @param state
 */
export const selectTouAndPpConsent = (state: RootState): boolean =>
  state.settings.securityPrivacy.consentToTOUnPP

export const selectIsBalanceVisibilityOn = (state: RootState): boolean =>
  state.settings.securityPrivacy.balanceVisibility

// actions
export const { setCoreAnalytics, setTouAndPpConsent, toggleBalanceVisibility } =
  securityPrivacySlice.actions

export const securityPrivacyReducer = securityPrivacySlice.reducer
