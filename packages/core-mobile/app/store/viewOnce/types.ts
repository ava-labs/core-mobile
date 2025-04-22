export enum ViewOnceKey {
  CHART_INTERACTION,
  BROWSER_INTERACTION,
  CORE_INTRO,
  ANALYTICS_CONSENT,
  P_CHAIN_FAVORITE,
  X_CHAIN_FAVORITE,
  DEFAULT_WATCHLIST_FAVORITES,
  NOTIFICATIONS_PROMPT,
  HALLIDAY_BANNER,
  STAKE_ONBOARDING,
  BRIDGE_ONBOARDING
}

export type ViewOnceObjectType = {
  [key in ViewOnceKey]: boolean
}

export type ViewOnceState = {
  data: ViewOnceObjectType
}
