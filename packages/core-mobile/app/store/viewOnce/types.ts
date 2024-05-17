export enum ViewOnceKey {
  CHART_INTERACTION,
  BROWSER_INTERACTION,
  CORE_INTRO,
  ANALYTICS_CONSENT,
  P_CHAIN_FAVORITE
}

export type ViewOnceObjectType = {
  [key in ViewOnceKey]: boolean
}

export type ViewOnceState = {
  data: ViewOnceObjectType
}
