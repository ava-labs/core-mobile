enum Root {
  Wallet = 'Stacks.Wallet',
  Onboard = 'Stacks.Onboard',
  Welcome = 'Stacks.Welcome',
  NoWallet = 'Stacks.NoWallet'
}

enum OnboardScreens {
  Init = 'OnboardScreens.Init',
  AnalyticsConsent = 'OnboardScreens.AnalyticsConsent',
  CreateWalletStack = 'OnboardScreens.CreateWalletStack',
  EnterWithMnemonicStack = 'OnboardScreens.EnterWithMnemonicStack',
  Login = 'OnboardScreens.Login'
}

enum CreateWalletNavigationScreens {
  CreateWallet = 'CreateWalletNavigationScreens.CreateWallet',
  CheckMnemonic = 'CreateWalletNavigationScreens.CheckMnemonic',
  CreatePin = 'CreateWalletNavigationScreens.CreatePin',
  BiometricLogin = 'CreateWalletNavigationScreens.BiometricLogin',
  TermsNConditions = 'CreateWalletNavigationScreens.TermsNConditions',
  ProtectFunds = 'CreateWalletNavigationScreens.ProtectFunds',
  Loader = 'CreateWalletNavigationScreens.Loader'
}

enum LoginWithMnemonicStackScreens {
  LoginWithMnemonic = 'LoginWithMnemonicStackScreens.LoginWithMnemonic',
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
  ActivityDetail = 'WalletScreens.ActivityDetail',
  Bridge = 'WalletScreens.Bridge',
  QRCode = 'WalletScreens.QRCode',
  Earn = 'WalletScreens.Earn',
  Notifications = 'WalletScreens.Notifications',
  DeFiProtocolDetails = 'WalletScreens.DeFiProtocolDetails',
  SendFeedback = 'WalletScreens.SendFeedback'
}

enum NoWalletScreens {
  CurrencySelector = 'NoWalletScreens.CurrencySelector',
  Drawer = 'NoWalletScreens.Drawer',
  Legal = 'NoWalletScreens.Legal',
  Tabs = 'NoWalletScreens.Tabs',
  Welcome = 'NoWalletScreens.Welcome'
}

enum NoWalletTabs {
  ExistingWallet = 'Recover Wallet',
  NewWallet = 'New Wallet',
  EnterWallet = 'Enter Wallet'
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
  EarnNotificationsPrompt = 'EarnScreens.EarnNotificationsPrompt',
  FundsStuck = 'EarnScreens.FundsStuck',
  WrongNetwork = 'EarnScrens.WrongNetwork'
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
  Swap = 'SwapScreens.Swap',
  Review = 'SwapScreens.Review'
}

enum NftScreens {
  Details = 'NftScreens.Details',
  Send = 'NftScreens.Send',
  FullScreen = 'NftScreens.FullScreen'
}

enum NftSendScreens {
  AddressPick = 'NftSendScreens.AddressPick',
  Review = 'NftSendScreens.Review',
  Success = 'NftSendScreens.Success'
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
  QRCode = 'SecurityPrivacyScreens.QRCode'
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

enum Tabs {
  Portfolio = 'Portfolio',
  Activity = 'Activity',
  Swap = 'Swap',
  More = 'More',
  Watchlist = 'Watchlist',
  Stake = 'Stake',
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
  // rpc prompts for wallet connect v1
  SessionProposal = 'ModalScreens.SessionProposal',
  CreateRemoveContact = 'ModalScreens.CreateRemoveContact',
  UpdateContact = 'ModalScreens.UpdateContact',
  SelectAccount = 'ModalScreens.SelectAccount',
  BuyCarefully = 'ModalScreens.BuyCarefully',
  SignTransaction = 'ModalScreens.SignTransaction',
  AvalancheSendTransaction = 'ModalScreens.AvalancheSendTransaction',
  AvalancheSignTransaction = 'ModalScreens.AvalancheSignTransaction',
  SignMessage = 'ModalScreens.SignMessage',
  BridgeAsset = 'ModalScreens.BridgeAsset',
  AddEthereumChain = 'ModalScreens.AddEthereumChain',
  SwitchEthereumChain = 'ModalScreens.SwitchEthereumChain',
  // rpc prompts for wallet connect v2
  SessionProposalV2 = 'ModalScreens.SessionProposalV2',
  SignMessageV2 = 'ModalScreens.SignMessageV2',
  CreateRemoveContactV2 = 'ModalScreens.CreateRemoveContactV2',
  UpdateContactV2 = 'ModalScreens.UpdateContactV2',
  SelectAccountV2 = 'ModalScreens.SelectAccountV2',
  AddEthereumChainV2 = 'ModalScreens.AddEthereumChainV2',
  SwitchEthereumChainV2 = 'ModalScreens.SwitchEthereumChainV2',
  BridgeAssetV2 = 'ModalScreens.BridgeAssetV2',
  SignTransactionV2 = 'ModalScreens.SignTransactionV2',
  AvalancheSendTransactionV2 = 'ModalScreens.AvalancheSendTransactionV2',
  AvalancheSignTransactionV2 = 'ModalScreens.AvalancheSignTransactionV2',
  StakeDisclaimer = 'ModalScreens.StakeDisclaimer'
}

enum SendScreens {
  Send = 'SendScreens.Send',
  Review = 'SendScreens.Review'
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
  HideWarning = 'BridgeScreens.HideWarning'
}

enum PortfolioScreens {
  Portfolio = 'PortfolioScreens.Portfolio',
  NetworkTokens = 'PortfolioScreens.NetworkTokens',
  DeFiProtocol = 'PortfolioScreens.DeFiProtocol'
}

const AppNavigation = {
  Root: Root,
  Onboard: OnboardScreens,
  CreateWallet: CreateWalletNavigationScreens,
  LoginWithMnemonic: LoginWithMnemonicStackScreens,
  Wallet: WalletScreens,
  NoWallet: NoWalletScreens,
  SecurityPrivacy: SecurityPrivacyScreens,
  Legal: LegalScreens,
  Advanced: AdvancedScreens,
  Tabs: Tabs,
  NoWalletTabs: NoWalletTabs,
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
  StakeSetup: StakeSetupScreens,
  Notifications: NotificationsScreens,
  SendFeedback: SendFeedbackScreens
}

export default AppNavigation
