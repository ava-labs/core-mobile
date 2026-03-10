export type AnalyticsEvents = {
  AccountSelectorAddAccount: { accountNumber: number }
  ExplorerLinkClicked: undefined
  AccessExistingWalletClicked: undefined
  AnalyticsEnabled: undefined
  AnalyticsDisabled: undefined
  ApplicationLaunched: { FontScale: number }
  ApplicationOpened: undefined

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

  HallidayBuyClicked: undefined
  CoinbasePayBuyClicked: undefined
  ConnectedSiteRemoved: {
    walletConnectVersion: string
    url: string
    name: string
  }
  CreatedANewAccountSuccessfully: { walletType: string }
  AppIconChanged: { iconName: string }
  CurrencySettingChanged: { currency: string }
  CurrencySettingClicked: undefined
  DeveloperModeEnabled: undefined
  DeveloperModeDisabled: undefined
  ManageTokensAddCustomToken: { status: string; address: string }
  MnemonicWalletImported: { walletType: string }
  PrivateKeyWalletImported: { walletType: string }
  MoonpayBuyClicked: undefined
  NetworkEnabled: { networkChainId: string; isCustom: boolean }
  NetworkDisabled: { networkChainId: string; isCustom: boolean }
  DefaultWatchlistFavoritesAdded: undefined
  'Onboard:WalletNameSet': undefined
  OnboardingAnalyticsAccepted: undefined
  OnboardingAnalyticsRejected: undefined
  OnboardingMnemonicImported: undefined
  OnboardingMnemonicVerified: undefined
  OnboardingPasswordSet: undefined
  OnboardingSubmitSucceeded: { walletType: string }
  OnboardingSubmitFailed: { walletType: string }
  PortfolioManageTokenListClicked: undefined
  PortfolioAssetsClicked: undefined
  PortfolioCollectiblesClicked: undefined
  PortfolioDeFiClicked: undefined
  PortfolioActivityClicked: undefined
  PortfolioTokenSelected: { name: string; symbol: string; chainId: number }
  ReceivePageVisited: undefined
  RecoveryPhraseClicked: undefined
  SendTransactionFailed: { errorMessage: string; chainId: number }
  SeedlessAddMfa: { type: string }
  SeedlessMfaAdded: undefined
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
  StakeCancelClaim: undefined
  StakeClaimFail: undefined
  StakeClaimSuccess: undefined
  StakeCountStakes: { active: number; history: number; total: number }
  StakeDelegationSuccess: undefined
  StakeDelegationFail: undefined
  StakeIssueClaim: undefined
  StakeIssueDelegation: undefined
  StakeOpened: undefined
  StakeOpenDurationSelect: undefined
  SwapReviewOrder: {
    provider: string
    slippage: number
  }
  SwapConfirmed: {
    address: string
    txHash: string
    chainId: string
  }
  SwapFailed: {
    address: string
    chainId: string
  }
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
  BrowserSearchSubmitted: undefined
  BrowserDiscoverEcosystemProjectTapped: { url: string }
  BrowserDiscoverFeaturedProjectTapped: { url: string }
  BrowserDiscoverLearnTapped: { url: string }
  BrowserFavoritesTapped: undefined
  BrowserSuggestedTapped: { url: string }
  BrowserBackTapped: undefined
  BrowserForwardTapped: undefined
  BrowserRefreshTapped: undefined
  BrowserAddToFavoriteTapped: undefined
  BrowserTabsOpened: undefined
  BrowserNewTabTapped: undefined
  BrowserContextualMenuOpened: undefined
  BrowserShareTapped: undefined
  BrowserViewHistoryTapped: undefined
  BrowserHistoryTapped: { url: string }
  WalletConnectedToDapp: { dAppUrl: string }
  TxSubmittedToDapp: undefined
  eth_sendTransaction_success: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  avalanche_sendTransaction_success: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  bitcoin_sendTransaction_success: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  solana_signAndSendTransaction_success: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  eth_sendTransaction_confirmed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  avalanche_sendTransaction_confirmed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  bitcoin_sendTransaction_confirmed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  solana_signAndSendTransaction_confirmed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  eth_sendTransaction_failed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  avalanche_sendTransaction_failed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  bitcoin_sendTransaction_failed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }
  solana_signAndSendTransaction_failed: {
    dAppUrl: string
    address: string
    chainId: string
    txHash: string
  }

  // CP-7989 - Address and Tx Hash Analytics Collection
  AccountAddressesUpdated: {
    addresses: {
      address: string
      addressBtc: string
      addressAVM: string
      addressPVM: string
      addressCoreEth: string
      addressSVM: string
    }[]
  }
  SendTransactionSucceeded: { txHash: string; chainId: number }

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

  // PUSH NOTIFICATIONS
  PushNotificationPromptShown: undefined
  PushNotificationAccepted: undefined
  PushNotificationRejected: undefined
  PushNotificationPressed: {
    channelId: string
    deeplinkUrl?: string
  }
  PushNotificationUnsubscribed: {
    channelId: string
  }
  PushNotificationSubscribed: {
    channelId: string
    tokenId?: string
  }

  // App Review
  InAppReviewRequested: undefined

  // CORE EARN (defi deposit/withdraw/claim)
  EarnOpened: undefined
  EarnDepositStart: undefined
  EarnDepositSubmitted: {
    token: string
    quantity: string
    protocol: string
    txHash: string
    address: string
  }
  EarnDepositSuccess: undefined
  EarnDepositFailure: undefined
  EarnWithdrawStart: undefined
  EarnWithdrawSubmitted: {
    token: string
    quantity: string
    protocol: string
    txHash: string
    address: string
  }
  EarnWithdrawSuccess: undefined
  EarnWithdrawFailure: undefined
  EarnClaimSuccess: undefined
  EarnClaimFailure: undefined
  EarnBorrowStart: undefined
  EarnBorrowSubmitted: {
    token: string
    quantity: string
    protocol: string
    txHash: string
    address: string
  }
  EarnBorrowSuccess: undefined
  EarnBorrowFailure: undefined
  EarnRepayStart: undefined
  EarnRepaySubmitted: {
    token: string
    quantity: string
    protocol: string
    txHash: string
    address: string
  }
  EarnRepaySuccess: undefined
  EarnRepayFailure: undefined

  // NEST EGG CAMPAIGN
  NestEggCampaignModalViewed: { addressC: string }
  NestEggSuccessModalViewed: { addressC: string }
  NestEggQualified: {
    addressC: string
    txHash: string
    chainId: number
    fromTokenSymbol: string
    toTokenSymbol: string
    fromAmountUsd: number
    timestamp: number
  }
}
