/**
 * Payload for dApp transaction lifecycle analytics events
 * (_success, _confirmed, _failed).
 *
 * chainId is a CAIP-2 identifier, NOT a numeric chain ID.
 * Examples: "eip155:1", "eip155:43114",
 *           "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
 *           "bip122:000000000019d6689c085ae165831e93"
 */
type DappTxEventPayload = {
  dAppUrl: string
  address: string
  /** CAIP-2 chain identifier (e.g. "eip155:1", "solana:...", "bip122:...") */
  chainId: string
  txHash: string
}

/**
 * Events sent via captureWithEncryption that also carry plaintext properties.
 * Define the full shape here — both `encrypted` (goes into the encrypted blob)
 * and `plaintext` (sent unencrypted, queryable in PostHog) — so the complete
 * event schema is visible in one place.
 *
 * AnalyticsEvents and AnalyticsPlaintextEvents are derived automatically.
 */
export type EncryptedEventDefinitions = {
  SendTransactionSucceeded: {
    encrypted: { txHash: string; chainId: number }
    plaintext: { caip2ChainId: string }
  }
  SwapConfirmed: {
    encrypted: {
      sourceAddress: string
      targetAddress: string
      sourceChainId: string
      targetChainId: string
      sourceTxHash?: string
      quoteSelectionMode: 'manual' | 'auto'
      autoRetryAttempt?: number
    }
    plaintext: {
      caip2SourceChainId: string
      caip2TargetChainId: string
    }
  }
}

export type AnalyticsPlaintextEvents = {
  [K in keyof EncryptedEventDefinitions]: EncryptedEventDefinitions[K]['plaintext']
}

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
  SeedlessLoginFailed: { reason: string }
  SeedlessRegisterTOTPStartFailed: undefined
  SeedlessSignIn: { oidcProvider: number }
  SeedlessSignUp: { oidcProvider: number }
  StakeCancelClaim: undefined
  StakeClaimFail: undefined
  StakeClaimSuccess: undefined
  StakeCountStakes: { active: number; history: number; total: number }
  StakeDelegationSuccess: { isAdvanced: boolean }
  StakeDelegationFail: { isAdvanced: boolean }
  StakeIssueClaim: undefined
  StakeIssueDelegation: undefined
  StakeOpened: undefined
  StakeOpenDurationSelect: undefined
  SwapReviewOrder: {
    provider: string
    slippage: number
  }
  SwapConfirmed: EncryptedEventDefinitions['SwapConfirmed']['encrypted']
  SwapSuccessful: {
    sourceAddress: string
    targetAddress: string
    sourceChainId: string
    targetChainId: string
    sourceTxHash: string
    targetTxHash?: string
  }
  SwapFailed: {
    sourceAddress: string
    targetAddress: string
    sourceChainId: string
    targetChainId: string
    sourceTxHash?: string
    targetTxHash?: string
    errorCode?: string
    errorReason?: string
  }
  SwapRefunded: {
    sourceAddress: string
    targetAddress: string
    sourceChainId: string
    targetChainId: string
    sourceTxHash: string
    targetTxHash?: string
    refundTxHash?: string
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
  eth_sendTransaction_success: DappTxEventPayload
  avalanche_sendTransaction_success: DappTxEventPayload
  bitcoin_sendTransaction_success: DappTxEventPayload
  solana_signAndSendTransaction_success: DappTxEventPayload
  eth_sendTransaction_confirmed: DappTxEventPayload
  avalanche_sendTransaction_confirmed: DappTxEventPayload
  bitcoin_sendTransaction_confirmed: DappTxEventPayload
  solana_signAndSendTransaction_confirmed: DappTxEventPayload
  eth_sendTransaction_failed: DappTxEventPayload
  avalanche_sendTransaction_failed: DappTxEventPayload
  bitcoin_sendTransaction_failed: DappTxEventPayload
  solana_signAndSendTransaction_failed: DappTxEventPayload
  solana_signTransaction_approved: Omit<DappTxEventPayload, 'txHash'>

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
  SendTransactionSucceeded: EncryptedEventDefinitions['SendTransactionSucceeded']['encrypted']

  StakeTransactionStarted: { txHash: string; chainId: number }
  BridgeTransactionStarted: {
    sourceTxHash: string
    chainId: number
    fromAddress?: string
    toAddress?: string
  }

  //Gasless
  GaslessFundSuccessful: { fundTxHash: string }
  GaslessFundFailed: { errorMessage: string; errorCategory: string }

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

  // IMPORT LEDGER FLOW
  OnboardingImportLedgerSelected: undefined
  OnboardingLedgerDerivationPathBIP44Selected: undefined
  OnboardingLedgerDerivationPathLedgerLiveSelected: undefined
  OnboardingLedgerConnected: undefined
  OnboardingLedgerConnectionFailed: undefined
  OnboardingLedgerWalletAdded: undefined
  OnboardingLedgerWalletAddFailed: undefined
  OnboardingLedgerSolanaKeysDerived: undefined
  OnboardingLedgerSolanaKeysDerivedFailed: undefined
  AddWalletWithLedgerClicked: undefined
  WalletImportLedgerDerivationPathBIP44Selected: undefined
  WalletImportLedgerDerivationPathLedgerLiveSelected: undefined
  WalletImportLedgerConnected: undefined
  WalletImportLedgerConnectionFailed: undefined
  WalletImportLedgerWalletAdded: undefined
  WalletImportLedgerWalletAddFailed: undefined
  WalletImportLedgerAccountAdded: undefined
  WalletImportLedgerAccountAddFailed: undefined
  WalletImportLedgerSolanaKeysDerived: undefined
  WalletImportLedgerSolanaKeysDerivedFailed: undefined
  LedgerAccountDiscoveryCompleted: {
    accountCount: number
    activeIndices: number[]
  }
  LedgerAccountDiscoveryFailed: undefined

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

  // PREDICTIONS
  PredictionsBetStarted: {
    tickerId: string
    outcome: 'YES' | 'NO'
    amountUsd: number
    limitPrice: string
  }
  PredictionsBetSucceeded: {
    tickerId: string
    outcome: 'YES' | 'NO'
    amountUsd: number
  }
  PredictionsBetFailed: {
    tickerId: string
    outcome: 'YES' | 'NO'
    error: string
  }

  PredictionsDepositStarted: { tokenSymbol: string; amountUsd: number }
  PredictionsDepositSucceeded: {
    tokenSymbol: string
    amountUsd: number
    usdcReceived: number
  }
  PredictionsDepositFailed: { tokenSymbol: string; error: string }

  PredictionsWithdrawStarted: {
    tickerId: string
    outcome: 'YES' | 'NO'
    count: string
  }
  PredictionsWithdrawSucceeded: { tickerId: string; usdcReceived: number }
  PredictionsWithdrawFailed: { tickerId: string; error: string }

  PredictionsKYCStarted: undefined
  PredictionsKYCApproved: undefined
  PredictionsKYCRejected: { reason: string }

  PredictionsSearched: { query: string; resultCount: number }
  PredictionsClicked: undefined
  PerpsClicked: undefined
}
