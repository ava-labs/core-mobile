import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { initialState } from './types'

const reducerName = 'securityPrivacy'

export const securityPrivacySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setCoreAnalytics: (state, action: PayloadAction<boolean | undefined>) => {
      state.coreAnalytics = action.payload
    },
    setLockWalletWithPIN: (state, action: PayloadAction<boolean>) => {
      state.lockWalletWithPIN = action.payload
    },
    /**
     * Set Terms of use and Privacy policy consent
     */
    setTouAndPpConsent: (state, action: PayloadAction<boolean>) => {
      state.consentToTOUnPP = action.payload
    },
    togglePrivacyMode: state => {
      state.privacyModeEnabled = !state.privacyModeEnabled
    }
  }
})

// selectors
export const selectCoreAnalyticsConsent = (
  state: RootState
): boolean | undefined => state.settings.securityPrivacy.coreAnalytics

// selectors
export const selectLockWalletWithPIN = (state: RootState): boolean =>
  state.settings.securityPrivacy.lockWalletWithPIN

/**
 * Select Terms of use and Privacy policy consent
 * @param state
 */
export const selectTouAndPpConsent = (state: RootState): boolean =>
  state.settings.securityPrivacy.consentToTOUnPP

export const selectIsPrivacyModeEnabled = (state: RootState): boolean =>
  state.settings.securityPrivacy.privacyModeEnabled

// actions
export const {
  setCoreAnalytics,
  setTouAndPpConsent,
  togglePrivacyMode,
  setLockWalletWithPIN
} = securityPrivacySlice.actions

export const securityPrivacyReducer = securityPrivacySlice.reducer
