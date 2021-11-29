enum Root {
  Wallet = 'Stacks.Wallet',
  Onboard = 'Stacks.Onboard',
  Welcome = 'Stacks.Welcome',
}

enum OnboardScreens {
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
}

enum LoginWithMnemonicStackScreens {
  LoginWithMnemonic = 'LoginWithMnemonicStackScreens.LoginWithMnemonic',
  CreatePin = 'LoginWithMnemonicStackScreens.CreatePin',
  BiometricLogin = 'LoginWithMnemonicStackScreens.BiometricLogin',
}

enum WalletScreens {
  Drawer = 'WalletScreens.Drawer',
  Tabs = 'WalletScreens.Tabs',
  // PortfolioScreen = 'PortfolioScreen',
  SearchScreen = 'WalletScreens.SearchScreen',
  AddCustomToken = 'WalletScreens.AddCustomToken',
  CurrencySelector = 'WalletScreens.CurrencySelector',
  SecurityPrivacy = 'WalletScreens.SecurityPrivacy',
  Legal = 'WalletScreens.Legal',
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
}

enum ModalScreens {
  SendReceiveBottomSheet = 'ModalScreens.SendReceiveBottomSheet',
  AccountBottomSheet = 'ModalScreens.AccountBottomSheet',
  TransactionDetailBottomSheet = 'ModalScreens.TransactionDetailBottomSheet',
  ReceiveOnlyBottomSheet = 'ModalScreens.ReceiveOnlyBottomSheet',
  SignOut = 'ModalScreens.SignOut',
}

enum SendTokenScreens {
  SendTokenScreen = 'SendTokenScreen',
  ConfirmTransactionScreen = 'ConfirmTransactionScreen',
  DoneScreen = 'DoneScreen',
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
  SendToken: SendTokenScreens,
};

export default AppNavigation;
