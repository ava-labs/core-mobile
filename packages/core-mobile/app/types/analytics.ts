export type AnalyticsEvents = {
  AccountSelectorOpened: undefined
  AccountSelectorAccountSwitched: { accountIndex: number }
  AccountSelectorAddAccount: { accountNumber: number }
  AccountSelectorBtcAddressCopied: undefined
  AccountSelectorEthAddressCopied: undefined
  ActivityCardDetailShown: undefined
  ActivityCardLinkClicked: undefined
  AddContactClicked: undefined
  AddContactFailed: undefined
  AddContactSucceeded: undefined
  AccessExistingWalletClicked: undefined
  AnalyticsEnabled: undefined
  AnalyticsDisabled: undefined
  ApplicationLaunched: { FontScale: number }
  ApplicationOpened: undefined

  // BRIDGE
  Bridge_TokenSelected: undefined
  BridgeTokenSelectError: { errorMessage: string }
  BridgeTransferRequestError: {
    sourceBlockchain: string
    targetBlockchain: string
  }
  BridgeTransferRequestSucceeded: undefined
  BridgeTransferRequestUserRejectedError: {
    sourceBlockchain: string
    targetBlockchain: string
    fee: number
  }
  BridgeTransferStarted: { sourceBlockchain: string; targetBlockchain: string }
  BridgeTransactionHide: undefined
  BridgeTransactionHideCancel: undefined
  BridgeGasFeeOptionChanged: { modifier: string }

  // UNIFIED BRIDGE
  UnifedBridgeTransferStarted: {
    bridgeType: string
    activeChainId: number
    targetChainId: number
  }

  ChangePasswordClicked: undefined
  ChangePasswordSucceeded: undefined
  ChangePasswordFailed: undefined
  HallidayBuyClicked: undefined
  CoinbasePayBuyClicked: undefined
  CollectibleItemClicked: { chainId: string }
  CollectibleSendClicked: { chainId: string }
  ConnectedSitesClicked: undefined
  ConnectedSiteRemoved: {
    walletConnectVersion: string
    url: string
    name: string
  }
  'CreateWallet:WalletNameSet': undefined
  CreatedANewAccountSuccessfully: { walletType: string }
  CurrencySettingChanged: { currency: string }
  CurrencySettingClicked: undefined
  DeveloperModeEnabled: undefined
  DeveloperModeDisabled: undefined
  FABItemSelected_Bridge: undefined
  FABItemSelected_Buy: undefined
  FABItemSelected_Send: undefined
  FABItemSelected_Receive: undefined
  FABItemSelected_Swap: undefined
  FABItemSelected_WalletConnect: undefined
  FABClosed: undefined
  FABOpened: undefined
  HelpCenterClicked: undefined
  LegalClicked: undefined
  'LoginWithMnemonic:WalletNameSet': undefined
  ManageNetworksClicked: undefined
  ManageTokensAddCustomToken: { status: string; address: string }
  MoonpayBuyClicked: undefined
  NetworkDetailsClicked: { chainId: number }
  NetworkFavoriteAdded: { networkChainId: string; isCustom: boolean }
  NetworkFavoriteRemoved: { networkChainId: string; isCustom: boolean }
  DefaultWatchlistFavoritesAdded: undefined
  NetworkSwitcherOpened: undefined
  NftSendFailed: { errorMessage: string; chainId: number }
  NftSendSucceeded: { chainId: number }
  NftSendContactSelected: { contactSource: string }
  'Onboard:WalletNameSet': undefined
  OnboardingAnalyticsAccepted: undefined
  OnboardingAnalyticsRejected: undefined
  OnboardingCancelled: undefined
  OnboardingMnemonicCreated: undefined
  OnboardingMnemonicImported: undefined
  OnboardingMnemonicVerified: undefined
  OnboardingPasswordSet: undefined
  OnboardingSubmitSucceeded: { walletType: string }
  OnboardingSubmitFailed: { walletType: string }
  PortfolioActivityClicked: undefined
  PortfolioAssetsClicked: undefined
  PortfolioCollectiblesClicked: undefined
  PortfolioDeFiClicked: undefined
  PortfolioPrimaryNetworkClicked: { chainId: number }
  PortfolioSecondaryNetworkClicked: { chainId: number }
  PortfolioTokenSelected: { selectedToken: string }
  PrivacyPolicyClicked: undefined
  ReceivePageVisited: undefined
  RecoveryPhraseClicked: undefined
  SendTransactionFailed: { errorMessage: string; chainId: number }
  SendContactSelected: { contactSource: string }
  Send_TokenSelected: undefined
  sendFeedbackClicked: undefined
  SeedlessAddMfa: { type: string }
  SeedlessMfaAdded: undefined
  SeedlessExportInitiated: undefined
  SeedlessExportInitiateFailed: undefined
  SeedlessExportCompleted: undefined
  SeedlessExportCompleteFailed: undefined
  SeedlessExportCancelled: undefined
  SeedlessExportCancelFailed: undefined
  SeedlessExportPhraseCopied: undefined
  SeedlessExportPhraseHidden: undefined
  SeedlessExportPhraseRevealed: undefined
  SeedlessMfaVerified: { type: string }
  SeedlessLoginFailed: undefined
  SeedlessRegisterTOTPStartFailed: undefined
  SeedlessSignIn: { oidcProvider: number }
  SeedlessSignUp: { oidcProvider: number }
  SignInWithRecoveryPhraseClicked: undefined
  StakeBegin: { from: string }
  StakeCancelClaim: undefined
  StakeCancelStaking: { from: string }
  StakeClaim: undefined
  StakeClaimFail: undefined
  StakeClaimSuccess: undefined
  StakeCountStakes: { active: number; history: number; total: number }
  StakeDelegationSuccess: undefined
  StakeDelegationFail: undefined
  StakeIssueClaim: undefined
  StakeIssueDelegation: undefined
  StakeOpened: undefined
  StakeOpenEnterAmount: undefined
  StakeOpenDurationSelect: undefined
  StakeOpenStakingDisclaimer: undefined
  StakeOpenStakingDocs: { from: string }
  StakeSelectAdvancedStaking: undefined
  StakeStartNodeSearch: { from: string; duration: string }
  StakeUseAmountPercentage: { percent: string }
  SwapTransactionFailed: {
    address: string
    chainId: number
  }
  SwapReviewOrder: {
    destinationInputField: string
    slippageTolerance: number
  }
  Swap_TokenSelected: undefined
  TermsAndConditionsAccepted: undefined
  TermsOfUseClicked: undefined
  TokenListTokenSelected: { selectedToken: string }
  TokenReceiveClicked: { chainId: number }
  TokenSendClicked: { chainId: number }
  TokenSwapClicked: { chainId: number }
  TokenBridgeClicked: { chainId: number }
  TotpValidationFailed: { error: string }
  TotpValidationSuccess: undefined
  WalletConnectSessionApprovedV2: {
    namespaces?: string
    requiredNamespaces: string
    optionalNamespaces?: string
    dappUrl: string
  }

  // CP-7638 - DeFi aggregator
  DeFiAggregatorsCount: { count: number }
  DeFiCardClicked: undefined
  DeFiCardLaunchButtonlicked: undefined
  DeFiDetailLaunchButtonClicked: undefined

  // In App Browser
  BrowserOpened: { openTabs: number }
  BrowserWelcomeScreenButtonTapped: undefined
  BrowserSearchSubmitted: undefined
  BrowserDiscoverDAppTapped: { url: string }
  BrowserDiscoverLearnTapped: { url: string }
  BrowserDiscoverTopProjectTapped: { url: string }
  BrowserFavoritesTapped: undefined
  BrowserSuggestedTapped: { url: string }
  BrowserBackTapped: undefined
  BrowserForwardTapped: undefined
  BrowserAddToFavoriteTapped: undefined
  BrowserTabsOpened: undefined
  BrowserNewTabTapped: undefined
  BrowserContextualMenuOpened: undefined
  BrowserShareTapped: undefined
  BrowserViewHistoryTapped: undefined
  WalletConnectedToDapp: { dAppUrl: string }
  TxSubmittedToDapp: undefined

  // CP-7989 - Address and Tx Hash Analytics Collection
  AccountAddressesUpdated: {
    addresses: {
      address: string
      addressBtc: string
      addressAVM: string
      addressPVM: string
      addressCoreEth: string
    }[]
  }
  SendTransactionSucceeded: { txHash: string; chainId: number }
  SwapTransactionSucceeded: { txHash: string; chainId: number }
  StakeTransactionStarted: { txHash: string; chainId: number }
  BridgeTransactionStarted: {
    sourceTxHash: string
    chainId: number
    fromAddress?: string
    toAddress?: string
  }

  //Gasless
  GaslessFundSuccessful: { fundTxHash: string }
  GaslessFundFailed: undefined
}
