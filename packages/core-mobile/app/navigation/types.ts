import type { CompositeScreenProps } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { DrawerScreenProps as RNDrawerScreenProps } from '@react-navigation/drawer'
import {
  Alert,
  DisplayData,
  Hex,
  SigningData,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import { RpcRequest } from '@avalabs/vm-module-types'
import { AdvancedStackParamList } from 'navigation/wallet/AdvancedStackScreen'
import { AvalancheCreateContactRequest as AvalancheCreateContactRequestV2 } from 'store/rpc/handlers/contact/avalanche_createContact/avalanche_createContact'
import { AvalancheRemoveContactRequest as AvalancheRemoveContactRequestV2 } from 'store/rpc/handlers/contact/avalanche_removeContact/avalanche_removeContact'
import { CorePrimaryAccount, Contact as SharedContact } from '@avalabs/types'
import { AvalancheUpdateContactRequest as AvalancheUpdateContactRequestV2 } from 'store/rpc/handlers/contact/avalanche_updateContact/avalanche_updateContact'
import { AvalancheBridgeAssetRequest as AvalancheBridgeAssetRequestV2 } from 'store/rpc/handlers/avalanche_bridgeAsset/avalanche_bridgeAsset'
import { Asset, Blockchain } from '@avalabs/core-bridge-sdk'
import { WalletAddEthereumChainRpcRequest as WalletAddEthereumChainRpcRequestV2 } from 'store/rpc/handlers/chain/wallet_addEthereumChain/wallet_addEthereumChain'
import { Network } from '@avalabs/core-chains-sdk'
import { WalletSwitchEthereumChainRpcRequest as WalletSwitchEthereumChainRpcRequestV2 } from 'store/rpc/handlers/chain/wallet_switchEthereumChain/wallet_switchEthereumChain'
import { EarnStackParamList } from 'navigation/wallet/EarnScreenStack/EarnScreenStack'
import { RefreshTokenScreenStackParamList } from 'navigation/RefreshTokenScreenStack'
import { BrowserStackParamList } from 'navigation/wallet/BrowserScreenStack'
import { Eip1559Fees } from 'utils/Utils'
import { WalletGetEthereumChainRpcRequest } from 'store/rpc/handlers/chain/wallet_getEthereumChain/wallet_getEthereumChain'
import {
  AvalancheSetDeveloperModeApproveData,
  AvalancheSetDeveloperModeRpcRequest
} from 'store/rpc/handlers/avalanche_setDeveloperMode/types'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { SiteScanResponse } from 'services/blockaid/types'
import { SpendLimit } from 'hooks/useSpendLimits'
import { ProposalTypes } from '@walletconnect/types'
import { UR } from '@ngraveio/bc-ur'
import { DebugStackParamList } from 'debug/navigation/DebugStack'
import { RootScreenStackParamList } from './RootScreenStack'
import { OnboardingScreenStackParamList } from './OnboardScreenStack'
import { WelcomeScreenStackParamList } from './onboarding/WelcomeScreenStack'
import { CreateWalletStackParamList } from './onboarding/CreateWalletStack'
import { EnterWithMnemonicStackParamList } from './onboarding/EnterWithMnemonicStack'
import { RecoverWithKeystoneParamList } from './onboarding/RecoverWithKeystone'
import { WalletScreenStackParams } from './WalletScreenStack/WalletScreenStack'
import { DrawerParamList } from './wallet/DrawerScreenStack'
import { TabNavigatorParamList } from './wallet/TabNavigator'
import { SendStackParamList } from './wallet/SendScreenStack'
import { ReceiveStackParamList } from './wallet/ReceiveScreenStack'
import { SwapStackParamList } from './wallet/SwapScreenStack'
import { NFTStackParamList } from './wallet/NFTScreenStack'
import { NFTSendStackParamList } from './wallet/NFTSendStack'
import { SecurityStackParamList } from './wallet/SecurityPrivacyStackScreen'
import { BridgeStackParamList } from './wallet/BridgeScreenStack'
import { PortfolioStackParamList } from './wallet/PortfolioScreenStack'
import { StakeSetupStackParamList } from './wallet/EarnScreenStack/StakeSetupScreenStack'
import { RecoveryMethodsStackParamList } from './onboarding/RecoveryMethodsStack'
import { SeedlessExportStackParamList } from './wallet/SeedlessExportStack'
import { SettingRecoveryMethodsStackParamList } from './wallet/SettingRecoveryMethodsStack'
import { BuyStackParamList } from './wallet/BuyScreenStack'

export type { RootScreenStackParamList }

export type TokenSelectParams = {
  hideZeroBalance?: boolean
  onTokenSelected: (token: TokenWithBalance) => void
}

export type BridgeTransactionStatusParams = {
  txHash: string
}

export type EditGasLimitParams = {
  network: Network
  onSave: (customFees: Eip1559Fees) => void
  lowMaxFeePerGas: bigint
  isGasLimitEditable?: boolean
  feeDecimals?: number
  noGasLimitError?: string
} & Eip1559Fees

export type EditSpendLimitParams = {
  updateSpendLimit(limitData: SpendLimit): void
  onClose(): void
  spendLimit: SpendLimit
  editingToken: {
    defaultValue: Hex
    decimals: number
  }
  dAppName?: string
}

export type TransactionDataParams = {
  data: string
  onClose(): void
}

export type SessionProposalV2Params = {
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
  scanResponse?: SiteScanResponse
}

export type CreateRemoveContactV2Params = {
  request: AvalancheCreateContactRequestV2 | AvalancheRemoveContactRequestV2
  contact: SharedContact
  action: 'create' | 'remove'
}

export type UpdateContactV2Params = {
  request: AvalancheUpdateContactRequestV2
  contact: SharedContact
}

export type BuyCarefullyParams = {
  provider: string
}

export type ApprovalPopupParams = {
  request: RpcRequest
  displayData: DisplayData
  signingData: SigningData
  onApprove: ({
    network,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    overrideData
  }: {
    network: Network
    account: CorePrimaryAccount
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    overrideData?: string
  }) => Promise<void>
  onReject: (message?: string) => void
}

export type KeystoneSignerParams = {
  requesrUR: UR
  responseURTypes: string[]
  onApprove: (cbor: Buffer) => Promise<void>
  onReject: (message?: string) => void
}

export type AvalancheSetDeveloperModeParams = {
  request: AvalancheSetDeveloperModeRpcRequest
  data: AvalancheSetDeveloperModeApproveData
}

export type BridgeAssetV2Params = {
  request: AvalancheBridgeAssetRequestV2
  amountStr: string
  asset: Asset
  currentBlockchain: Blockchain
}

export type AddEthereumChainV2Params = {
  request: WalletAddEthereumChainRpcRequestV2
  network: Network
  isExisting: boolean
}

export type SwitchEthereumChainV2Params = {
  request: WalletSwitchEthereumChainRpcRequestV2
  network: Network
}

export type GetEthereumChainParams = {
  request: WalletGetEthereumChainRpcRequest
  network: Network
}

export type AlertScreenParams = {
  alert: Alert
  onProceed: () => void
  onReject: () => void
}

export type QRCodeParams = {
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

/** ROOT -> REFRESH TOKEN **/
export type RefreshTokenScreenProps<
  T extends keyof RefreshTokenScreenStackParamList
> = CompositeScreenProps<
  StackScreenProps<RefreshTokenScreenStackParamList, T>,
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

/** ROOT -> ONBOARD -> WELCOME -> CONNECT WITH KEYSTONE **/
export type RecoverWithKeystoneScreenProps<
  T extends keyof RecoverWithKeystoneParamList
> = CompositeScreenProps<
  StackScreenProps<RecoverWithKeystoneParamList, T>,
  WelcomeScreenProps<keyof WelcomeScreenStackParamList>
>

/** ROOT -> ONBOARD -> RECOVERY METHODS **/
export type RecoveryMethodsScreenProps<
  T extends keyof RecoveryMethodsStackParamList
> = CompositeScreenProps<
  StackScreenProps<RecoveryMethodsStackParamList, T>,
  RootStackScreenProps<keyof RootScreenStackParamList>
>

/** ROOT -> WALLET **/
export type WalletScreenProps<T extends keyof WalletScreenStackParams> =
  CompositeScreenProps<
    StackScreenProps<WalletScreenStackParams, T>,
    RootStackScreenProps<keyof RootScreenStackParamList>
  >

/** ROOT -> WALLET -> BUY **/
export type BuyScreenProps<T extends keyof BuyStackParamList> =
  CompositeScreenProps<
    StackScreenProps<BuyStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> DRAWER **/
export type DrawerScreenProps<T extends keyof DrawerParamList> =
  CompositeScreenProps<
    RNDrawerScreenProps<DrawerParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> DRAWER -> TABS **/
export type TabsScreenProps<T extends keyof TabNavigatorParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabNavigatorParamList, T>,
    DrawerScreenProps<keyof DrawerParamList>
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

/** ROOT -> WALLET -> EARN **/
export type EarnScreenProps<T extends keyof EarnStackParamList> =
  CompositeScreenProps<
    StackScreenProps<EarnStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> EARN -> STAKE SETUP **/
export type StakeSetupScreenProps<T extends keyof StakeSetupStackParamList> =
  CompositeScreenProps<
    StackScreenProps<StakeSetupStackParamList, T>,
    EarnScreenProps<keyof EarnStackParamList>
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

/** ROOT -> WALLET -> SECURITY PRIVACY -> SEEDLESS EXPORT **/
export type SeedlessExportScreenProps<
  T extends keyof SeedlessExportStackParamList
> = CompositeScreenProps<
  StackScreenProps<SeedlessExportStackParamList, T>,
  SecurityPrivacyScreenProps<keyof SecurityStackParamList>
>

/** ROOT -> WALLET -> BRIDGE **/
export type BridgeScreenProps<T extends keyof BridgeStackParamList> =
  CompositeScreenProps<
    StackScreenProps<BridgeStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> BROWSER **/
export type BrowserScreenProps<T extends keyof BrowserStackParamList> =
  CompositeScreenProps<
    StackScreenProps<BrowserStackParamList, T>,
    WalletScreenProps<keyof WalletScreenStackParams>
  >

/** ROOT -> WALLET -> SECURITY PRIVACY -> RECOVERY METHODS **/
export type SettingRecoveryMethodsScreenProps<
  T extends keyof SettingRecoveryMethodsStackParamList
> = CompositeScreenProps<
  StackScreenProps<SettingRecoveryMethodsStackParamList, T>,
  SecurityPrivacyScreenProps<keyof SecurityStackParamList>
>

/** ROOT -> DEBUG **/
export type DebugScreenProps<T extends keyof DebugStackParamList> =
  StackScreenProps<DebugStackParamList, T>
