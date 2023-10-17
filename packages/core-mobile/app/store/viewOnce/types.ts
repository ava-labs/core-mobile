export enum ViewOnceKey {
  CHART_INTERACTION,
  BROWSER_INTERACTION
}

export type ViewOnceObjectType = {
  [key in ViewOnceKey]: boolean
}

export type ViewOnceState = {
  data: ViewOnceObjectType
}
