export enum ViewOnceInformationKey {
  CHART_INTERACTION
}

export type ViewOnceInformationState = {
  items: ViewOnceInformationKey[]
}

export type ViewOnceInformation = {
  infoHasBeenShown: (key: ViewOnceInformationKey) => boolean
  saveViewOnceInformation: (key: ViewOnceInformationKey) => void
  reset: () => void
}
