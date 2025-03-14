export const initialState: SecurityNPrivacyState = {
  coreAnalytics: undefined,
  consentToTOUnPP: false,
  balanceVisibility: true
}

export type SecurityNPrivacyState = {
  coreAnalytics: boolean | undefined
  consentToTOUnPP: boolean
  balanceVisibility: boolean
}
