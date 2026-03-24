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
  SwapConfirmed: {
    sourceAddress: string
    targetAddress: string
    sourceChainId: string
    targetChainId: string
    sourceTxHash?: string
    quoteSelectionMode: 'manual' | 'auto'
    autoRetryAttempt?: number
  }
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
  ImportLedger_Started: undefined
  ImportLedger_BIP44_Selected: undefined
  ImportLedger_LedgerLive_Selected: undefined
  ImportLedger_BT_Connected: undefined
  ImportLedger_BT_ConnectFailed: undefined
  ImportLedger_WalletAdded: undefined
  ImportLedger_WalletAddFailed: undefined
  ImportLedger_AccountAdded: undefined
  ImportLedger_AccountAddFailed: undefined
  ImportLedger_SolanaEnabled: undefined
  ImportLedger_SolanaEnableFailed: undefined

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
