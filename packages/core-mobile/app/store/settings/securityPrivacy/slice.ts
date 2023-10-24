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
    }
  }
})

// selectors
export const selectCoreAnalyticsConsent = (state: RootState) =>
  state.settings.securityPrivacy.coreAnalytics

/**
 * Select Terms of use and Privacy policy consent
 * @param state
 */
export const selectTouAndPpConsent = (state: RootState) =>
  state.settings.securityPrivacy.consentToTOUnPP

// actions
export const { setCoreAnalytics, setTouAndPpConsent } =
  securityPrivacySlice.actions

export const securityPrivacyReducer = securityPrivacySlice.reducer
