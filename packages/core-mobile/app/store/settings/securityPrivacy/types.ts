export const initialState: SecurityNPrivacyState = {
  coreAnalytics: undefined,
  consentToTOUnPP: false,
  privacyModeEnabled: false,
  lockWalletWithPIN: true
}

export type SecurityNPrivacyState = {
  coreAnalytics: boolean | undefined
  consentToTOUnPP: boolean
  privacyModeEnabled: boolean
  lockWalletWithPIN: boolean
}
