enum Root {
  Wallet = 'Stacks.Wallet',
  Onboard = 'Stacks.Onboard',
  Welcome = 'Stacks.Welcome',
}

enum OnboardScreens {
  Init = 'OnboardScreens.Init',
  Welcome = 'OnboardScreens.Welcome',
  CreateWalletStack = 'OnboardScreens.CreateWalletStack',
  EnterWithMnemonicStack = 'OnboardScreens.EnterWithMnemonicStack',
  Login = 'OnboardScreens.Login',
}

enum CreateWalletNavigationScreens {
  CreateWallet = 'CreateWalletNavigationScreens.CreateWallet',
  CheckMnemonic = 'CreateWalletNavigationScreens.CheckMnemonic',
  CreatePin = 'CreateWalletNavigationScreens.CreatePin',
  BiometricLogin = 'CreateWalletNavigationScreens.BiometricLogin',
  ProtectFunds = 'CreateWalletNavigationScreens.ProtectFunds',
}

enum LoginWithMnemonicStackScreens {
  LoginWithMnemonic = 'LoginWithMnemonicStackScreens.LoginWithMnemonic',
  CreatePin = 'LoginWithMnemonicStackScreens.CreatePin',
  BiometricLogin = 'LoginWithMnemonicStackScreens.BiometricLogin',
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
  TokenManagement = 'WalletScreens.TokenManagement',
  SecurityPrivacy = 'WalletScreens.SecurityPrivacy',
  NetworkSelector = 'WalletScreens.NetworkSelector',
  Swap = 'WalletScreens.Swap',
  NFTDetails = 'WalletScreens.NFTDetails',
  NFTManage = 'WalletScreens.NFTManage',
  TokenDetail = 'WalletScreens.TokenDetail',
  OwnedTokenDetail = 'WalletScreens.OwnedTokenDetail',
  ActivityDetail = 'WalletScreens.ActivityDetail',
  Bridge = 'WalletScreens.Bridge',
}

enum SwapScreens {
  Swap = 'SwapScreens.Swap',
  Review = 'SwapScreens.Review',
  Success = 'SwapScreens.Success',
  Fail = 'SwapScreens.Fail',
  SwapTransactionFee = 'ModalScreens.SwapTransactionFees',
}

enum NftScreens {
  Details = 'NftScreens.Details',
  Send = 'NftScreens.Send',
  FullScreen = 'NftScreens.FullScreen',
}

enum NftSendScreens {
  AddressPick = 'NftSendScreens.AddressPick',
  Review = 'NftSendScreens.Review',
  Success = 'NftSendScreens.Success',
  Fail = 'NftSendScreens.Fail',
}

enum SecurityPrivacyScreens {
  SecurityPrivacy = 'SecurityPrivacyScreens.SecurityPrivacy',
  PinChange = 'SecurityPrivacyScreens.PinChange',
  CreatePin = 'SecurityPrivacyScreens.CreatePin',
  ShowRecoveryPhrase = 'SecurityPrivacyScreens.ShowRecoveryPhrase',
  TurnOnBiometrics = 'SecurityPrivacyScreens.TurnOnBiometrics',
  RecoveryPhrase = 'SecurityPrivacyScreens.RecoveryPhrase',
}

enum Tabs {
  Portfolio = 'Portfolio',
  Activity = 'Activity',
  Swap = 'Swap',
  More = 'More',
  Watchlist = 'Watchlist',
  Tabs = 'Tabs',
  Fab = 'Fab',
  Bridge = 'Bridge',
}

enum ModalScreens {
  AccountDropDown = 'ModalScreens.AccountDropDown',
  AccountBottomSheet = 'ModalScreens.AccountBottomSheet',
  TransactionDetailBottomSheet = 'ModalScreens.TransactionDetailBottomSheet',
  ReceiveOnlyBottomSheet = 'ModalScreens.ReceiveOnlyBottomSheet',
  SignOut = 'ModalScreens.SignOut',
  SelectToken = 'ModalScreens.SelectToken',
  EditGasLimit = 'ModalScreens.EditGasLimit',
  BridgeSelectToken = 'ModalScreens.BridgeSelectToken',
}

enum SendScreens {
  Send = 'SendScreens.Send',
  Review = 'SendScreens.Review',
  Success = 'SendScreens.Success',
}

enum AddressBookScreens {
  List = 'AddressBookScreens.List',
  Add = 'AddressBookScreens.Add',
  Edit = 'AddressBookScreens.Edit',
  Details = 'AddressBookScreens.Details',
}

enum BridgeScreens {
  Bridge = 'BridgeScreens.Swap',
  BridgeTransactionStatus = 'BridgeScreens.BridgeTransactionStatus',
  HideWarning = 'BridgeScreens.HideWarning',
}

const AppNavigation = {
  Root: Root,
  Onboard: OnboardScreens,
  CreateWallet: CreateWalletNavigationScreens,
  LoginWithMnemonic: LoginWithMnemonicStackScreens,
  Wallet: WalletScreens,
  SecurityPrivacy: SecurityPrivacyScreens,
  Tabs: Tabs,
  Modal: ModalScreens,
  Swap: SwapScreens,
  Nft: NftScreens,
  NftSend: NftSendScreens,
  Send: SendScreens,
  AddressBook: AddressBookScreens,
  Bridge: BridgeScreens,
};

export default AppNavigation;
