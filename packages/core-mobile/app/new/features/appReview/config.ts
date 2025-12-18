export type AppReviewConfig = {
  minSuccessfulTxForPrompt: number
  cooldownMs: number
}

const PROD_DEFAULTS: AppReviewConfig = {
  minSuccessfulTxForPrompt: 4,
  cooldownMs: 4 * 31 * 24 * 60 * 60 * 1000 // ~4 months
}

const DEV_DEFAULTS: AppReviewConfig = {
  // Make it easy to test in dev:
  minSuccessfulTxForPrompt: 1,
  cooldownMs: 60 * 1000 // 1 minute
}

export function getAppReviewConfig(): AppReviewConfig {
  return __DEV__ ? DEV_DEFAULTS : PROD_DEFAULTS
}
