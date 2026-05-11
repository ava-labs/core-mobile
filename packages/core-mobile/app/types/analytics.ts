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
 * All analytics event payloads.
 *
 * Events with an `encrypted` field are automatically encrypted by
 * `AnalyticsService.capture` at transport time — the `encrypted` object is
 * JSON-stringified and encrypted via HPKE before being sent to PostHog.
 * Any sibling fields at the same level are forwarded as plaintext properties
 * (e.g. CAIP-2 chain IDs used for PostHog dashboard filtering).
 *
 * Rule for encrypted events: put sensitive data (addresses, tx hashes, chain
 * IDs) inside `encrypted`. Only add plaintext siblings when the field is
 * explicitly intended to be readable on the dashboard.
 */
export type AnalyticsEvents = {
  AccountSelectorAddAccount: { accountNumber: number }
  ExplorerLinkClicked: undefined
  AccessExistingWalletClicked: undefined
  AnalyticsEnabled: undefined
  AnalyticsDisabled: undefined
  ApplicationLaunched: { FontScale: number }
  ApplicationOpened: undefined

  // UNIFIED BRIDGE
  UnifedBridgeTransferStarted: {
    bridgeType: string
    activeChainId: number
    targetChainId: number
  }
  BridgeTransactionStarted: {
    encrypted: {
      sourceTxHash: string
      chainId: number
      fromAddress?: string
      toAddress?: string
    }
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
  SendTransactionSucceeded: {
    encrypted: { txHash: string; chainId: number }
    caip2ChainId: string
  }
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
  StakeTransactionStarted: {
    encrypted: { txHash: string; chainId: number }
  }
  SwapReviewOrder: {
    provider: string
    slippage: number
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
    caip2SourceChainId: string
    caip2TargetChainId: string
    quickSwapsEnabled?: boolean
    quickSwapsFeeSetting?: 'low' | 'medium' | 'high'
    quickSwapsMaxBuy?: 'unlimited' | '1000' | '5000' | '10000' | '50000'
  }
  SwapSuccessful: {
    encrypted: {
      sourceAddress: string
      targetAddress: string
      sourceChainId: string
      targetChainId: string
      sourceTxHash: string
      targetTxHash?: string
    }
  }
  SwapFailed: {
    encrypted: {
      sourceAddress: string
      targetAddress: string
      sourceChainId: string
      targetChainId: string
      sourceTxHash?: string
      targetTxHash?: string
      errorCode?: string
      errorReason?: string
    }
  }
  SwapRefunded: {
    encrypted: {
      sourceAddress: string
      targetAddress: string
      sourceChainId: string
      targetChainId: string
      sourceTxHash: string
      targetTxHash?: string
      refundTxHash?: string
    }
  }
  QuickSwapsToggled: { isEnabled: boolean }
  QuickSwapsBypassFired: {
    caip2SourceChainId: string
    maxBuy: 'unlimited' | '1000' | '5000' | '10000' | '50000'
  }
  QuickSwapsBypassFellBack: {
    caip2SourceChainId: string
    requiresManualApproval: boolean
    reason:
      | 'context_missing'
      | 'tx_flagged_warning'
      | 'tx_flagged_malicious'
      | 'simulation_failed'
      | 'min_amount_out_missing'
      | 'balance_change_missing'
      | 'token_address_missing'
      | 'source_token_not_found'
      | 'destination_token_not_found'
      | 'amount_calculation_failed'
      | 'amount_below_minimum'
      | 'usd_pricing_unavailable'
      | 'amount_over_limit'
      | 'slippage_unavailable'
      | 'slippage_exceeded'
      | 'unknown'
  }
  // Emitted at swap-dispatch time when Quick Swaps is enabled but the
  // active quote's serviceType isn't Markr (so the bypass can't fire).
  // `markrQuoteAvailable` answers: would the bypass have fired if the
  // user had picked the Markr quote from the dropdown?
  QuickSwapsBypassOpportunityMissed: {
    caip2SourceChainId: string
    activeServiceType: string
    markrQuoteAvailable: boolean
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

  // CP-7989 - Address and Tx Hash Analytics Collection
  AccountAddressesUpdated: {
    encrypted: {
      addresses: {
        address: string
        addressBtc: string
        addressAVM: string
        addressPVM: string
        addressCoreEth: string
        addressSVM: string
      }[]
    }
  }

  // dApp transaction lifecycle
  eth_sendTransaction_success: { encrypted: DappTxEventPayload }
  avalanche_sendTransaction_success: { encrypted: DappTxEventPayload }
  bitcoin_sendTransaction_success: { encrypted: DappTxEventPayload }
  solana_signAndSendTransaction_success: { encrypted: DappTxEventPayload }
  eth_sendTransaction_confirmed: { encrypted: DappTxEventPayload }
  avalanche_sendTransaction_confirmed: { encrypted: DappTxEventPayload }
  bitcoin_sendTransaction_confirmed: { encrypted: DappTxEventPayload }
  solana_signAndSendTransaction_confirmed: { encrypted: DappTxEventPayload }
  eth_sendTransaction_failed: { encrypted: DappTxEventPayload }
  avalanche_sendTransaction_failed: { encrypted: DappTxEventPayload }
  bitcoin_sendTransaction_failed: { encrypted: DappTxEventPayload }
  solana_signAndSendTransaction_failed: { encrypted: DappTxEventPayload }
  solana_signTransaction_approved: {
    encrypted: Omit<DappTxEventPayload, 'txHash'>
  }

  // NEST EGG CAMPAIGN
  NestEggCampaignModalViewed: { encrypted: { addressC: string } }
  NestEggSuccessModalViewed: { encrypted: { addressC: string } }
  NestEggQualified: {
    encrypted: {
      addressC: string
      txHash: string
      chainId: number
      fromTokenSymbol: string
      toTokenSymbol: string
      fromAmountUsd: number
      timestamp: number
    }
  }
}
