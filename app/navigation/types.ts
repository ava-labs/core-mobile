import type { CompositeScreenProps } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { DrawerScreenProps as RNDrawerScreenProps } from '@react-navigation/drawer'
import { BigNumber } from 'ethers'
import { TokenWithBalance } from 'store/balance'
import {
  NoWalletDrawerParamList,
  NoWalletScreenStackParams
} from 'navigation/NoWalletScreenStack'
import { NoWalletTabNavigatorParamList } from 'navigation/wallet/NoWalletTabNavigator'
import { AdvancedStackParamList } from 'navigation/wallet/AdvancedStackScreen'
import { RootScreenStackParamList } from './RootScreenStack'
import { OnboardingScreenStackParamList } from './OnboardScreenStack'
import { WelcomeScreenStackParamList } from './onboarding/WelcomeScreenStack'
import { CreateWalletStackParamList } from './onboarding/CreateWalletStack'
import { EnterWithMnemonicStackParamList } from './onboarding/EnterWithMnemonicStack'
import { WalletScreenStackParams } from './WalletScreenStack'
import { DrawerParamList } from './wallet/DrawerScreenStack'
import { TabNavigatorParamList } from './wallet/TabNavigator'
import { SendStackParamList } from './wallet/SendScreenStack'
import { ReceiveStackParamList } from './wallet/ReceiveScreenStack'
import { SwapStackParamList } from './wallet/SwapScreenStack'
import { NFTStackParamList } from './wallet/NFTScreenStack'
import { NFTSendStackParamList } from './wallet/NFTSendStack'
import { AddressBookStackParamList } from './wallet/AddressBookStack'
import { SecurityStackParamList } from './wallet/SecurityPrivacyStackScreen'
import { BridgeStackParamList } from './wallet/BridgeScreenStack'
import { PortfolioStackParamList } from './wallet/PortfolioScreenStack'
export type { RootScreenStackParamList }

export type TokenSelectParams = {
  hideZeroBalance?: boolean
  onTokenSelected: (token: TokenWithBalance) => void
}

export type BridgeTransactionStatusParams = {
  txHash: string
}

export type EditGasLimitParams = {
  onSave: (newGasLimit: number) => void
  gasLimit: number
  gasPrice: BigNumber
}

export type QRCodeParams = {
  onAction: (qrText: string) => void
  onScanned: (qrText: string) => void
}

/** ROOT **/
export type RootStackScreenProps<T extends keyof RootScreenStackParamList> =
  StackScreenProps<RootScreenStackParamList, T>

/** ROOT -> ONBOARD **/
export type OnboardScreenProps<T extends keyof OnboardingScreenStackParamList> =
  CompositeScreenProps<
    StackScreenProps<OnboardingScreenStackParamList, T>,
    RootStackScreenProps<keyof RootScreenStackParamList>
  >

/** ROOT -> ONBOARD -> WELCOME **/
export type WelcomeScreenProps<T extends keyof WelcomeScreenStackParamList> =
  CompositeScreenProps<
    StackScreenProps<WelcomeScreenStackParamList, T>,
    OnboardScreenProps<keyof OnboardingScreenStackParamList>
  >

/** ROOT -> ONBOARD -> WELCOME -> CREATE WALLET **/
export type CreateWalletScreenProps<
  T extends keyof CreateWalletStackParamList
> = CompositeScreenProps<
  StackScreenProps<CreateWalletStackParamList, T>,
  WelcomeScreenProps<keyof WelcomeScreenStackParamList>
>

/** ROOT -> ONBOARD -> WELCOME -> ENTER WITH MNEMONIC **/
export type EnterWithMnemonicScreenProps<
  T extends keyof EnterWithMnemonicStackParamList
> = CompositeScreenProps<
  StackScreenProps<EnterWithMnemonicStackParamList, T>,
  WelcomeScreenProps<keyof WelcomeScreenStackParamList>
>

/** ROOT -> WALLET **/
export type WalletScreenProps<T extends keyof WalletScreenStackParams> =
  CompositeScreenProps<
    StackScreenProps<WalletScreenStackParams, T>,
    RootStackScreenProps<keyof RootScreenStackParamList>
  >

/** ROOT -> NO WALLET **/
export type NoWalletScreenProps<T extends keyof NoWalletScreenStackParams> =
  CompositeScreenProps<
    StackScreenProps<NoWalletScreenStackParams, T>,
    RootStackScreenProps<keyof RootScreenStackParamList>
  >

/** ROOT -> WALLET -> DRAWER **/
export type DrawerScreenProps<T extends keyof DrawerParamList> =
  CompositeScreenProps<
    RNDrawerScreenProps<DrawerParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> NO WALLET -> DRAWER **/
export type NoWalletDrawerScreenProps<T extends keyof NoWalletDrawerParamList> =
  CompositeScreenProps<
    RNDrawerScreenProps<NoWalletDrawerParamList, T>,
    NoWalletScreenProps<keyof NoWalletScreenStackParams>
  >

/** ROOT -> WALLET -> DRAWER -> TABS **/
export type TabsScreenProps<T extends keyof TabNavigatorParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabNavigatorParamList, T>,
    DrawerScreenProps<keyof DrawerParamList>
  >

/** ROOT -> WALLET -> DRAWER -> TABS **/
export type NoTabsScreenProps<T extends keyof NoWalletTabNavigatorParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<NoWalletTabNavigatorParamList, T>,
    NoWalletDrawerScreenProps<keyof NoWalletDrawerParamList>
  >

/** ROOT -> WALLET -> DRAWER -> TABS -> PORTFOLIO **/
export type PortfolioScreenProps<T extends keyof PortfolioStackParamList> =
  CompositeScreenProps<
    StackScreenProps<PortfolioStackParamList, T>,
    TabsScreenProps<keyof TabNavigatorParamList>
  >

/** ROOT -> WALLET -> SEND TOKENS **/
export type SendTokensScreenProps<T extends keyof SendStackParamList> =
  CompositeScreenProps<
    StackScreenProps<SendStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> RECEIVE TOKENS **/
export type ReceiveTokensScreenProps<T extends keyof ReceiveStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ReceiveStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> SWAP **/
export type SwapScreenProps<T extends keyof SwapStackParamList> =
  CompositeScreenProps<
    StackScreenProps<SwapStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> NFT DETAILS **/
export type NFTDetailsScreenProps<T extends keyof NFTStackParamList> =
  CompositeScreenProps<
    StackScreenProps<NFTStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> NFT DETAILS -> SEND **/
export type NFTDetailsSendScreenProps<T extends keyof NFTSendStackParamList> =
  CompositeScreenProps<
    StackScreenProps<NFTSendStackParamList, T>,
    NFTDetailsScreenProps<keyof NFTStackParamList>
  >

/** ROOT -> WALLET -> ADDRESS BOOK **/
export type AddressBookScreenProps<T extends keyof AddressBookStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AddressBookStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> SECURITY PRIVACY **/
export type SecurityPrivacyScreenProps<T extends keyof SecurityStackParamList> =
  CompositeScreenProps<
    StackScreenProps<SecurityStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> SECURITY PRIVACY **/
export type AdvancedScreenProps<T extends keyof AdvancedStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AdvancedStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> BRIDGE **/
export type BridgeScreenProps<T extends keyof BridgeStackParamList> =
  CompositeScreenProps<
    StackScreenProps<BridgeStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >
