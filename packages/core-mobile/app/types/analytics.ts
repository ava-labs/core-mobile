export type AnalyticsEvents = {
  ApplicationLaunched: { FontScale: number }
  ApplicationOpened: undefined
  NetworkFavoriteAdded: { networkChainId: string; isCustom: boolean }
  NetworkFavoriteRemoved: { networkChainId: string; isCustom: boolean }
  OnboardingSubmitSucceeded: { walletType: string }
  OnboardingSubmitFailed: { walletType: string }
  TermsAndConditionsAccepted: undefined
  SeedlessExportInitiated: undefined
  SeedlessExportInitiateFailed: undefined
  SeedlessExportCompleted: undefined
  SeedlessExportCompleteFailed: undefined
  SeedlessExportCancelled: undefined
  SeedlessExportCancelFailed: undefined
  SeedlessExportPhraseCopied: undefined
  SeedlessExportPhraseHidden: undefined
  SeedlessExportPhraseRevealed: undefined
}
