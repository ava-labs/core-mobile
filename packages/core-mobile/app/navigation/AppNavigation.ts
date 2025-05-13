enum Root {
  Wallet = 'Root.Wallet',
  Onboard = 'Root.Onboard',
  RefreshToken = 'Root.RefreshToken',
  CopyPhraseWarning = 'Root.CopyPhraseWarning',
  VerifyTotpCode = 'Root.VerifyTotpCode',
  RecoveryMethods = 'Root.RecoveryMethods',
  SelectRecoveryMethods = 'Root.SelectRecoveryMethods'
}

enum OnboardScreens {
  Signup = 'OnboardScreens.Signup',
  AccessMnemonicWallet = 'AccessMnemonicWallet',
  Welcome = 'OnboardScreens.Welcome',
  AnalyticsConsent = 'OnboardScreens.AnalyticsConsent',
  CreateWalletStack = 'OnboardScreens.CreateWalletStack',
  EnterWithMnemonicStack = 'OnboardScreens.EnterWithMnemonicStack',
  RecoverWithMnemonicStack = 'OnboardScreens.RecoverWithMnemonicStack',
  CreatePin = 'OnboardScreens.CreatePin',
  NameYourWallet = 'OnboardScreens.NameYourWallet'
}

enum RefreshTokenScreens {
  LogoLoader = 'RefreshTokenScreens.LogoLoader',
  SessionTimeout = 'RefreshTokenScreens.SessionTimeout',
  WrongSocialAccount = 'RefreshTokenScreens.WrongSocialAccount'
}

enum CreateWalletNavigationScreens {
  CreateWallet = 'CreateWalletNavigationScreens.CreateWallet',
  CheckMnemonic = 'CreateWalletNavigationScreens.CheckMnemonic',
  NameYourWallet = 'CreateWalletNavigationScreens.NameYourWallet',
  CreatePin = 'CreateWalletNavigationScreens.CreatePin',
  BiometricLogin = 'CreateWalletNavigationScreens.BiometricLogin',
  TermsNConditions = 'CreateWalletNavigationScreens.TermsNConditions',
  ProtectFunds = 'CreateWalletNavigationScreens.ProtectFunds',
  Loader = 'CreateWalletNavigationScreens.Loader'
}

enum LoginWithMnemonicStackScreens {
  LoginWithMnemonic = 'LoginWithMnemonicStackScreens.LoginWithMnemonic',
  NameYourWallet = 'LoginWithMnemonicStackScreens.NameYourWallet',
  CreatePin = 'LoginWithMnemonicStackScreens.CreatePin',
  BiometricLogin = 'LoginWithMnemonicStackScreens.BiometricLogin',
  TermsNConditions = 'LoginWithMnemonicStackScreens.TermsNConditions',
  Loader = 'LoginWithMnemonicStackScreens.Loader'
}

enum WalletScreens {
  AddCustomToken = 'WalletScreens.AddCustomToken',
  AddressBook = 'WalletScreens.AddressBook',
  CurrencySelector = 'WalletScreens.CurrencySelector',
  Drawer = 'WalletScreens.Drawer',
  Legal = 'WalletScreens.Legal',
  Tabs = 'WalletScreens.Tabs',
  ReceiveTokens = 'WalletScreens.ReceiveTokens',
  SendTokens = 'WalletScreens.SendTokens',
  Buy = 'WalletScreens.Buy',
  TokenManagement = 'WalletScreens.TokenManagement',
  Advanced = 'WalletScreens.Advanced',
  SecurityPrivacy = 'WalletScreens.SecurityPrivacy',
  NetworkSelector = 'WalletScreens.NetworkSelector',
  NetworkDetails = 'WalletScreens.NetworkDetails',
  NetworkAddEdit = 'WalletScreens.NetworkAddEdit',
  Swap = 'WalletScreens.Swap',
  NFTDetails = 'WalletScreens.NFTDetails',
  NFTManage = 'WalletScreens.NFTManage',
  TokenDetail = 'WalletScreens.TokenDetail',
  OwnedTokenDetail = 'WalletScreens.OwnedTokenDetail',
  Bridge = 'WalletScreens.Bridge',
  QRCode = 'WalletScreens.QRCode',
  Earn = 'WalletScreens.Earn',
  Notifications = 'WalletScreens.Notifications',
  DeFiProtocolDetails = 'WalletScreens.DeFiProtocolDetails',
  SendFeedback = 'WalletScreens.SendFeedback',
  Halliday = 'WalletScreens.Halliday'
}

enum ReceiveTokensScreens {
  ReceiveCChain = 'ReceiveTokensScreens.ReceiveCChain'
}

enum BuyScreens {
  Buy = 'BuyScreens.Buy'
}

enum EarnScreens {
  StakeDashboard = 'EarnScreens.StakeDashboard',
  StakeDetails = 'EarnScreens.StakeDetails',
  StakeSetup = 'EarnScreens.StakeSetup',
  ClaimRewards = 'EarnScreens.ClaimRewards',
  FeeUnavailable = 'EarnScreens.FeeUnavailable',
  ClaimFundsStuck = 'EarnScreens.ClaimFundsStuck'
}

enum BrowserScreens {
  Intro = 'BrowserScreens.Intro',
  TabView = 'BrowserScreens.TabView',
  History = 'BrowserScreens.History',
  ClearAllHistory = 'BrowserScreens.ClearAllHistory'
}

enum StakeSetupScreens {
  GetStarted = 'StakeSetupScreens.GetStarted',
  SmartStakeAmount = 'StakeSetupScreens.SmartStakeAmount',
  StakingDuration = 'StakeSetupScreens.StakingDuration',
  AdvancedStaking = 'StakeSetupScreens.AdvancedStaking',
  SelectNode = 'StakeSetupScreens.SelectNode',
  NodeSearch = 'StakeSetupScreens.NodeSearch',
  Confirmation = 'StakeSetupScreens.Confirmation',
  Cancel = 'StakeSetupScreens.Cancel',
  FundsStuck = 'StakeSetupScreens.FundsStuck'
}

enum NotificationsScreens {
  Notifications = 'NotificationsScreens.Notifications'
}

enum SwapScreens {
  Swap = 'SwapScreens.Swap'
}

enum NftScreens {
  Details = 'NftScreens.Details',
  Send = 'NftScreens.Send',
  FullScreen = 'NftScreens.FullScreen'
}

enum NftSendScreens {
  Send = 'NftSendScreens.Send'
}

enum SecurityPrivacyScreens {
  SecurityPrivacy = 'SecurityPrivacyScreens.SecurityPrivacy',
  PinChange = 'SecurityPrivacyScreens.PinChange',
  CreatePin = 'SecurityPrivacyScreens.CreatePin',
  ShowRecoveryPhrase = 'SecurityPrivacyScreens.ShowRecoveryPhrase',
  TurnOnBiometrics = 'SecurityPrivacyScreens.TurnOnBiometrics',
  RecoveryPhrase = 'SecurityPrivacyScreens.RecoveryPhrase',
  DappList = 'SecurityPrivacyScreens.DappList',
  DappConnectModal = 'SecurityPrivacyScreens.DappConnectModal',
  QRCode = 'SecurityPrivacyScreens.QRCode',
  SeedlessExport = 'SecurityPrivacyScreens.SeedlessExport',
  SettingRecoveryMethods = 'SecurityPrivacyScreens.SettingRecoveryMethods'
}

enum LegalScreens {
  Legal = 'LegalScreens.Legal'
}

enum AdvancedScreens {
  Advanced = 'AdvancedScreens.Advanced',
  DappConnectModal = 'AdvancedScreens.DappConnectModal'
}

enum SendFeedbackScreens {
  SendFeedback = 'SendFeedbackScreens.SendFeedback'
}

export enum Tabs {
  Portfolio = 'Portfolio',
  Activity = 'Activity',
  Swap = 'Swap',
  More = 'More',
  Watchlist = 'Watchlist',
  Stake = 'Stake',
  Browser = 'Browser',
  Tabs = 'Tabs',
  Fab = 'Fab',
  Bridge = 'Bridge'
}

enum ModalScreens {
  AccountDropDown = 'ModalScreens.AccountDropDown',
  AccountBottomSheet = 'ModalScreens.AccountBottomSheet',
  TransactionDetailBottomSheet = 'ModalScreens.TransactionDetailBottomSheet',
  SignOut = 'ModalScreens.SignOut',
  SelectToken = 'ModalScreens.SelectToken',
  EditGasLimit = 'ModalScreens.EditGasLimit',
  BridgeSelectToken = 'ModalScreens.BridgeSelectToken',
  BuyCarefully = 'ModalScreens.BuyCarefully',
  // rpc prompts for wallet connect v2
  SessionProposalV2 = 'ModalScreens.SessionProposalV2',
  SignMessageV2 = 'ModalScreens.SignMessageV2',
  CreateRemoveContactV2 = 'ModalScreens.CreateRemoveContactV2',
  UpdateContactV2 = 'ModalScreens.UpdateContactV2',
  AddEthereumChainV2 = 'ModalScreens.AddEthereumChainV2',
  SwitchEthereumChainV2 = 'ModalScreens.SwitchEthereumChainV2',
  BridgeAssetV2 = 'ModalScreens.BridgeAssetV2',
  SignTransactionV2 = 'ModalScreens.SignTransactionV2',
  ApprovalPopup = 'ModalScreens.ApprovalPopup',
  EditSpendLimit = 'ModalScreens.EditSpendLimit',
  TransactionData = 'ModalScreens.TransactionData',
  AvalancheSetDeveloperMode = 'ModalScreens.AvalancheSetDeveloperMode',
  StakeDisclaimer = 'ModalScreens.StakeDisclaimer',
  CoreIntro = 'ModalScreens.CoreIntro',
  BrowserTabsList = 'ModalScreens.BrowserTabsList',
  BrowserTabCloseAll = 'ModalScreens.BrowserTabCloseAll',
  AnalyticsConsentSheet = 'ModalScreens.AnalyticsConsentSheet',
  UseWalletConnect = 'ModalScreens.UseWalletConnect',
  AlertScreen = 'ModalScreens.AlertScreen',
  EnableNotificationsPrompt = 'ModalScreens.EnableNotificationsPrompt',
  QRScanner = 'ModalScreens.QRScanner',
  SummitLondon2025 = 'ModalScreens.SummitLondon2025'
}

enum SendScreens {
  Send = 'SendScreens.Send'
}

enum AddressBookScreens {
  List = 'AddressBookScreens.List',
  Add = 'AddressBookScreens.Add',
  Details = 'AddressBookScreens.Details',
  DeleteConfirm = 'AddressBookScreens.DeleteConfirm',
  Share = 'AddressBookScreens.Share'
}

enum BridgeScreens {
  Bridge = 'BridgeScreens.Swap',
  BridgeTransactionStatus = 'BridgeScreens.BridgeTransactionStatus',
  HideWarning = 'BridgeScreens.HideWarning',
  Halliday = 'BridgeScreens.Halliday'
}

enum PortfolioScreens {
  Portfolio = 'PortfolioScreens.Portfolio',
  NetworkTokens = 'PortfolioScreens.NetworkTokens'
}

enum RecoveryMethodsScreens {
  AddRecoveryMethods = 'RecoveryMethodsScreens.AddRecoveryMethods',
  SelectRecoveryMethods = 'RecoveryMethodsScreens.SelectRecoveryMethods',
  AuthenticatorSetup = 'RecoveryMethodsScreens.AuthenticatorSetup',
  ScanQrCode = 'RecoveryMethodsScreens.ScanQrCode',
  LearnMore = 'RecoveryMethodsScreens.LearnMore',
  PasskeySetup = 'RecoveryMethodsScreens.PasskeySetup',
  FIDONameInput = 'RecoveryMethodsScreens.FIDONameInput'
}

enum SeedlessExportScreens {
  InitialScreen = 'SeedlessExportScreens.InitialScreen',
  Instructions = 'SeedlessExportScreens.Instructions',
  WaitingPeriodModal = 'SeedlessExportScreens.WaitingPeriodModal',
  RecoveryPhrasePending = 'SeedlessExportScreens.RecoveryPhrasePending',
  RecoveryPhrase = 'SeedlessExportScreens.RecoveryPhrase',
  ConfirmCancelModal = 'SeedlessExportScreens.ConfirmCancelModal',
  ConfirmCloseModal = 'SeedlessExportScreens.ConfirmCloseModal',
  LogoLoader = 'SeedlessExportScreens.LogoLoader'
}

enum SettingRecoveryMethodsScreens {
  SettingRecoveryMethods = 'SettingRecoveryMethodsScreens.SettingRecoveryMethods',
  SettingMFA = 'SettingRecoveryMethodsScreens.SettingMFA',
  SettingAuthenticatorSetup = 'SettingRecoveryMethodsScreens.SettingAuthenticatorSetup',
  SettingScanQrCode = 'SettingRecoveryMethodsScreens.SettingScanQrCode',
  SettingLearnMore = 'SettingRecoveryMethodsScreens.SettingLearnMore',
  ChangeTotpConfirmation = 'SettingRecoveryMethodsScreens.ChangeTotpConfirmation',
  RemovePasskeyConfirmation = 'SettingRecoveryMethodsScreens.RemovePasskeyConfirmation'
}

const AppNavigation = {
  Root: Root,
  Onboard: OnboardScreens,
  RefreshToken: RefreshTokenScreens,
  CreateWallet: CreateWalletNavigationScreens,
  LoginWithMnemonic: LoginWithMnemonicStackScreens,
  Wallet: WalletScreens,
  SecurityPrivacy: SecurityPrivacyScreens,
  Legal: LegalScreens,
  Advanced: AdvancedScreens,
  Tabs: Tabs,
  Modal: ModalScreens,
  Swap: SwapScreens,
  Nft: NftScreens,
  NftSend: NftSendScreens,
  Send: SendScreens,
  AddressBook: AddressBookScreens,
  Bridge: BridgeScreens,
  Portfolio: PortfolioScreens,
  ReceiveTokens: ReceiveTokensScreens,
  Buy: BuyScreens,
  Earn: EarnScreens,
  Browser: BrowserScreens,
  StakeSetup: StakeSetupScreens,
  Notifications: NotificationsScreens,
  SendFeedback: SendFeedbackScreens,
  RecoveryMethods: RecoveryMethodsScreens,
  SeedlessExport: SeedlessExportScreens,
  SettingRecoveryMethods: SettingRecoveryMethodsScreens
}

export default AppNavigation
