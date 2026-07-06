export enum ViewOnceKey {
  CHART_INTERACTION,
  ANALYTICS_CONSENT,
  X_CHAIN_FAVORITE,
  DEFAULT_WATCHLIST_FAVORITES,
  NOTIFICATIONS_PROMPT,
  HALLIDAY_BANNER,
  STAKE_ONBOARDING,
  /** @deprecated Removed with legacy bridge (CP-14118). Slot kept to preserve numeric values of subsequent members in persisted state. */
  BRIDGE_ONBOARDING,
  SWAP_ONBOARDING,
  SEND_ONBOARDING,
  AUTO_ENABLE_L2_CHAINS,
  SOLANA_LAUNCH,
  /** @deprecated */
  MIGRATE_TOKEN_FAVORITE_IDSv2,
  NOTIFICATIONS_CLEANED_UP_ANDROID_16,
  PERPETUALS_ONBOARDING
}

export type ViewOnceObjectType = {
  [key in ViewOnceKey]: boolean
}

export type ViewOnceState = {
  data: ViewOnceObjectType
}
