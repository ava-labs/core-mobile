export enum ViewOnceKey {
  CHART_INTERACTION
}

export type ViewOnceObjectType = {
  [key in ViewOnceKey]: boolean
}

export type ViewOnceState = {
  data: ViewOnceObjectType
}

export type ViewOnce = {
  hasBeenViewed: (key: ViewOnceKey) => boolean
  view: (key: ViewOnceKey) => void
}
