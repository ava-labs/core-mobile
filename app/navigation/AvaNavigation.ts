enum Stacks {
  App = 'App',
  Auth = 'Auth',
  CreateWallet = 'CreateWallet',
  Wallet = 'Wallet',
}

enum WalletScreen {
  Portfolio = 'Portfolio',
  Activity = 'Activity',
  Swap = 'Swap',
  More = 'More',
  Search = 'Search',

}


enum ModalScreen {
  SendReceiveBottomSheet = 'SendReceiveBottomSheet',
  AccountBottomSheet = 'AccountBottomSheet',
}

export enum AuthNavigationScreen {
  Onboard = 'Onboard',
  CreateWalletFlow = 'Create Wallet flow',
  LoginWithMnemonic = 'Login with mnemonic',
  Login = 'Login',
}

enum CreateWalletNavigationScreen {
  CreateWallet = 'Create Wallet',
  CheckMnemonic = 'Check mnemonic',
  CreatePin = 'Create pin',
  BiometricLogin = 'Biometric login',
}

const AvaNavigation = {
  Stack: Stacks,
  Wallet: WalletScreen,
  Auth: AuthNavigationScreen,
  CreateWallet: CreateWalletNavigationScreen,
  Modal: ModalScreen,
};

export default AvaNavigation;
