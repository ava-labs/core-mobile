export const initialState: SecurityNPrivacyState = {
  coreAnalytics: undefined,
  consentToTOUnPP: false
}

export type SecurityNPrivacyState = {
  coreAnalytics: boolean | undefined
  consentToTOUnPP: boolean
}
