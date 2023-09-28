export enum ViewOnceInformationKey {
  CHART_INTERACTION
}

export type ViewOnceObjectType = {
  [key in ViewOnceInformationKey]: boolean
}

export type ViewOnceInformationState = {
  data: ViewOnceObjectType
}

export type ViewOnceInformation = {
  hasBeenViewed: (key: ViewOnceInformationKey) => boolean
  view: (key: ViewOnceInformationKey) => void
}
