import React, { memo, useCallback } from 'react'
import { BackHandler } from 'react-native'
import {
  NavigatorScreenParams,
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import DrawerScreenStack, {
  DrawerParamList
} from 'navigation/wallet/DrawerScreenStack'
import TokenManagement from 'screens/tokenManagement/TokenManagement'
import AddCustomToken from 'screens/tokenManagement/AddCustomToken'
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector'
import SecurityPrivacyStackScreen, {
  SecurityStackParamList
} from 'navigation/wallet/SecurityPrivacyStackScreen'
import { MainHeaderOptions, SubHeaderOptions } from 'navigation/NavUtils'
import SignOutModal from 'screens/mainView/SignOutModal'
import {
  createStackNavigator,
  StackNavigationOptions
} from '@react-navigation/stack'
import ReceiveScreenStack, {
  ReceiveStackParamList
} from 'navigation/wallet/ReceiveScreenStack'
import BuyScreenStack, {
  BuyStackParamList
} from 'navigation/wallet/BuyScreenStack'
import SendScreenStack, {
  SendStackParamList
} from 'navigation/wallet/SendScreenStack'
import SwapScreenStack, {
  SwapStackParamList
} from 'navigation/wallet/SwapScreenStack'
import TokenDetails from 'screens/watchlist/TokenDetails/TokenDetails'
import OwnedTokenDetail from 'screens/portfolio/ownedTokenDetail/OwnedTokenDetail'
import BridgeScreenStack from 'navigation/wallet/BridgeScreenStack'
import NFTScreenStack, {
  NFTStackParamList
} from 'navigation/wallet/NFTScreenStack'
import NftManage from 'screens/nft/NftManage'
import SharedBridgeTransactionStatus from 'screens/shared/BridgeTransactionStatus'
import NetworkManager from 'screens/network/NetworkManager'
import NetworkDetails, {
  NetworkDetailsProps
} from 'screens/network/NetworkDetails'
import AvaButton from 'components/AvaButton'
import AddSVG from 'components/svg/AddSVG'
import AddEditNetwork, {
  AddEditNetworkProps
} from 'screens/network/AddEditNetwork'
import LegalStackScreen, {
  LegalStackParamList
} from 'navigation/wallet/LegalStackScreen'
import { NetworkDetailsAction } from 'screens/network/NetworkDetailsAction'
import CaptureDappQR from 'screens/shared/CaptureDappQR'
import { ChainID } from 'store/network'
import EarnScreenStack, {
  EarnStackParamList
} from 'navigation/wallet/EarnScreenStack/EarnScreenStack'
import NotificationsStackScreen, {
  NotificationsStackParamList
} from 'navigation/wallet/NotificationsStackScreen'
import { DeFiProtocolDetails } from 'screens/defi/DeFiProtocolDetails'
import SendFeedbackStackScreen from 'navigation/wallet/SendFeedbackStackScreen'
import { navigationRef } from 'utils/Navigation'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { useSelector } from 'react-redux'
import TestnetBanner from 'components/TestnetBanner'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NftMetadataProvider } from 'contexts/NftItemsContext'
import { BridgeProvider } from 'contexts/BridgeContext'
import { HallidayWebView } from 'screens/bridge/components/HallidayWebView'
import { BridgeStackParamList } from '../wallet/BridgeScreenStack'
import {
  AddEthereumChainV2Params,
  ApprovalPopupParams,
  AvalancheSetDeveloperModeParams,
  BridgeAssetV2Params,
  BridgeTransactionStatusParams,
  BuyCarefullyParams,
  CreateRemoveContactV2Params,
  EditGasLimitParams,
  EditSpendLimitParams,
  AlertScreenParams,
  QRCodeParams,
  SessionProposalV2Params,
  SwitchEthereumChainV2Params,
  TokenSelectParams,
  UpdateContactV2Params,
  WalletScreenProps,
  TransactionDataParams
} from '../types'
import AdvancedStackScreen, {
  AdvancedStackParamList
} from '../wallet/AdvancedStackScreen'
import { createModals } from './createModals'

const PolyfillCrypto = React.lazy(() => import('react-native-webview-crypto'))

type Props = {
  onExit: () => void
}

export type WalletScreenStackParams = {
  [AppNavigation.Wallet.Drawer]: NavigatorScreenParams<DrawerParamList>
  [AppNavigation.Wallet.TokenManagement]: undefined
  [AppNavigation.Wallet.SendTokens]:
    | NavigatorScreenParams<SendStackParamList>
    | undefined
  [AppNavigation.Wallet.ReceiveTokens]:
    | NavigatorScreenParams<ReceiveStackParamList>
    | undefined
  [AppNavigation.Wallet.Buy]:
    | NavigatorScreenParams<BuyStackParamList>
    | undefined
  [AppNavigation.Wallet.Halliday]: undefined
  [AppNavigation.Wallet.Bridge]:
    | NavigatorScreenParams<BridgeStackParamList>
    | undefined
  [AppNavigation.Wallet.AddCustomToken]: undefined
  [AppNavigation.Wallet.TokenDetail]: { tokenId: string }
  [AppNavigation.Wallet.OwnedTokenDetail]: { chainId: number; tokenId: string }
  [AppNavigation.Wallet.Swap]:
    | NavigatorScreenParams<SwapStackParamList>
    | undefined
  [AppNavigation.Wallet.Earn]:
    | NavigatorScreenParams<EarnStackParamList>
    | undefined
  [AppNavigation.Wallet.NFTDetails]: NavigatorScreenParams<NFTStackParamList>
  [AppNavigation.Wallet.NFTManage]: undefined
  [AppNavigation.Wallet.CurrencySelector]: undefined
  [AppNavigation.Wallet.NetworkSelector]: undefined
  [AppNavigation.Wallet.NetworkDetails]: NetworkDetailsProps
  [AppNavigation.Wallet.NetworkAddEdit]: AddEditNetworkProps
  [AppNavigation.Wallet.Advanced]: NavigatorScreenParams<AdvancedStackParamList>
  [AppNavigation.Wallet.SendFeedback]: undefined
  [AppNavigation.Wallet
    .Notifications]: NavigatorScreenParams<NotificationsStackParamList>
  [AppNavigation.Wallet.SecurityPrivacy]:
    | NavigatorScreenParams<SecurityStackParamList>
    | undefined
  [AppNavigation.Wallet.Legal]: NavigatorScreenParams<LegalStackParamList>
  [AppNavigation.Bridge.BridgeTransactionStatus]: BridgeTransactionStatusParams
  [AppNavigation.Wallet.QRCode]: QRCodeParams
  [AppNavigation.Modal.AccountDropDown]: undefined
  [AppNavigation.Modal.AccountBottomSheet]: undefined
  [AppNavigation.Modal.SignOut]: undefined
  [AppNavigation.Modal.SelectToken]: TokenSelectParams
  [AppNavigation.Modal.EditGasLimit]: EditGasLimitParams
  [AppNavigation.Modal.EditSpendLimit]: EditSpendLimitParams
  [AppNavigation.Modal.TransactionData]: TransactionDataParams
  [AppNavigation.Modal.BuyCarefully]: BuyCarefullyParams
  // rpc prompts for wallet connect v2
  [AppNavigation.Modal.SessionProposalV2]: SessionProposalV2Params
  [AppNavigation.Modal.CreateRemoveContactV2]: CreateRemoveContactV2Params
  [AppNavigation.Modal.UpdateContactV2]: UpdateContactV2Params
  [AppNavigation.Modal.AddEthereumChainV2]: AddEthereumChainV2Params
  [AppNavigation.Modal.SwitchEthereumChainV2]: SwitchEthereumChainV2Params
  [AppNavigation.Modal.BridgeAssetV2]: BridgeAssetV2Params
  [AppNavigation.Modal.ApprovalPopup]: ApprovalPopupParams
  [AppNavigation.Modal
    .AvalancheSetDeveloperMode]: AvalancheSetDeveloperModeParams
  [AppNavigation.Modal.StakeDisclaimer]: undefined
  [AppNavigation.Wallet.DeFiProtocolDetails]: { protocolId: string }
  [AppNavigation.Modal.CoreIntro]: undefined
  [AppNavigation.Modal.BrowserTabsList]: undefined
  [AppNavigation.Modal.BrowserTabCloseAll]: { onConfirm: () => void }
  [AppNavigation.Modal.AnalyticsConsentSheet]: undefined
  [AppNavigation.Modal.UseWalletConnect]: { onContinue: () => void }
  [AppNavigation.Modal.AlertScreen]: AlertScreenParams
  [AppNavigation.Modal.EnableNotificationsPrompt]: undefined
  [AppNavigation.Modal.QRScanner]: {
    onSuccess: (data: string) => void
    onCancel?: () => void
  }
}

const WalletScreenS = createStackNavigator<WalletScreenStackParams>()

export type WalletScreenSType = typeof WalletScreenS

export const SignOutModalScreen = (): JSX.Element => {
  const { signOut } = useApplicationContext().appHook

  const doSwitchWallet = (): void => {
    signOut()
  }

  return <SignOutModal onConfirm={doSwitchWallet} />
}

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

function WalletScreenStack(props: Props): JSX.Element {
  const hasBeenViewedCoreIntro = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.CORE_INTRO)
  )
  const hasBeenViewedAnalyticsConsent = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.ANALYTICS_CONSENT)
  )
  const navigation = useNavigation<NavigationProp>()
  const isTestnet = useSelector(selectIsDeveloperMode)

  const { onExit } = props

  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => {
        if (!navigationRef.current?.canGoBack()) {
          onExit()
          return true
        } else {
          return false
        }
      }
      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [onExit])
  )

  useFocusEffect(
    useCallback(() => {
      if (!hasBeenViewedCoreIntro) {
        navigation.navigate(AppNavigation.Modal.CoreIntro)
      } else if (!hasBeenViewedAnalyticsConsent) {
        navigation.navigate(AppNavigation.Modal.AnalyticsConsentSheet)
      }
    }, [hasBeenViewedCoreIntro, hasBeenViewedAnalyticsConsent, navigation])
  )

  return (
    <BridgeProvider>
      <NftMetadataProvider>
        {isTestnet && <TestnetBanner />}
        <WalletScreenS.Navigator
          screenOptions={{
            headerShown: false
          }}>
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Drawer}
            component={DrawerScreenStack}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions({
                title: 'Manage token list',
                headerBackTestID: 'header_back'
              })
            }}
            name={AppNavigation.Wallet.TokenManagement}
            component={TokenManagement}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.SendTokens}
            options={{
              headerShown: false
            }}
            component={SendScreenStack}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Buy}
            component={BuyScreenStack}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.ReceiveTokens}
            component={ReceiveScreenStack}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions({ title: 'Add Custom Token' })
            }}
            name={AppNavigation.Wallet.AddCustomToken}
            component={AddCustomToken}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions()
            }}
            name={AppNavigation.Wallet.TokenDetail}
            component={TokenDetails}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions()
            }}
            name={AppNavigation.Wallet.OwnedTokenDetail}
            component={OwnedTokenDetail}
          />
          <WalletScreenS.Screen
            options={{
              headerShown: false
            }}
            name={AppNavigation.Wallet.Swap}
            component={SwapScreenStack}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions({ title: 'Halliday' })
            }}
            name={AppNavigation.Wallet.Halliday}
            component={HallidayWebView}
          />
          <WalletScreenS.Screen
            options={{
              headerShown: false
            }}
            name={AppNavigation.Wallet.Earn}
            component={EarnScreenStack}
          />
          <WalletScreenS.Screen
            options={{
              headerShown: false
            }}
            name={AppNavigation.Wallet.NFTDetails}
            component={NFTScreenStack}
          />
          <WalletScreenS.Screen
            options={MainHeaderOptions()}
            name={AppNavigation.Wallet.NFTManage}
            component={NftManage}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions({ title: 'Currency' })
            }}
            name={AppNavigation.Wallet.CurrencySelector}
            component={CurrencySelector}
          />
          <WalletScreenS.Screen
            options={
              MainHeaderOptions({
                title: '',
                hideHeaderLeft: false,
                actionComponent: <AddNetworkAction />,
                headerBackTestID: 'header_back'
              }) as Partial<StackNavigationOptions>
            }
            name={AppNavigation.Wallet.NetworkSelector}
            component={NetworkSelectorScreen}
          />
          <WalletScreenS.Screen
            options={{
              ...MainHeaderOptions({
                title: '',
                hideHeaderLeft: false,
                actionComponent: <NetworkDetailsAction />,
                headerBackTestID: 'header_back'
              })
            }}
            name={AppNavigation.Wallet.NetworkDetails}
            component={NetworkDetailsScreen}
          />
          <WalletScreenS.Screen
            options={MainHeaderOptions({
              title: '',
              headerBackTestID: 'header_back'
            })}
            name={AppNavigation.Wallet.NetworkAddEdit}
            component={NetworkAddEditScreen}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Advanced}
            component={AdvancedStackScreen}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Notifications}
            component={NotificationsStackScreen}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.SendFeedback}
            component={SendFeedbackStackScreen}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.SecurityPrivacy}
            component={SecurityPrivacyStackScreen}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Legal}
            component={LegalStackScreen}
          />
          <WalletScreenS.Screen
            options={{
              ...SubHeaderOptions('Transaction Details', false, 'header_back')
            }}
            name={AppNavigation.Bridge.BridgeTransactionStatus}
            component={BridgeTransactionStatus}
          />
          <WalletScreenS.Screen
            name={AppNavigation.Wallet.Bridge}
            component={BridgeScreenStack}
          />
          <WalletScreenS.Screen
            options={{
              ...SubHeaderOptions('')
            }}
            name={AppNavigation.Wallet.QRCode}
            component={CaptureDappQR}
          />
          <WalletScreenS.Screen
            options={MainHeaderOptions({
              title: '',
              headerBackTestID: 'header_back'
            })}
            name={AppNavigation.Wallet.DeFiProtocolDetails}
            component={DeFiProtocolDetails}
          />
          {createModals(WalletScreenS)}
        </WalletScreenS.Navigator>
        <PolyfillCrypto />
      </NftMetadataProvider>
    </BridgeProvider>
  )
}

type BridgeTransactionStatusScreenProps = WalletScreenProps<
  typeof AppNavigation.Bridge.BridgeTransactionStatus
>

const BridgeTransactionStatus = (): JSX.Element => {
  const { txHash } =
    useRoute<BridgeTransactionStatusScreenProps['route']>().params

  return <SharedBridgeTransactionStatus txHash={txHash} />
}

type NetworkSelectorScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkSelector
>

function NetworkSelectorScreen(): JSX.Element {
  const { navigate, goBack } =
    useNavigation<NetworkSelectorScreenProps['navigation']>()

  function showNetworkDetails(chainId: ChainID): void {
    navigate(AppNavigation.Wallet.NetworkDetails, { chainId, goBack })
  }

  return <NetworkManager onShowInfo={showNetworkDetails} />
}

const AddNetworkAction = (): JSX.Element => {
  const { navigate } = useNavigation<NetworkSelectorScreenProps['navigation']>()
  return (
    <AvaButton.Icon
      onPress={() =>
        navigate(AppNavigation.Wallet.NetworkAddEdit, {
          mode: 'create'
        })
      }>
      <AddSVG hideCircle size={38} />
    </AvaButton.Icon>
  )
}

type NetworkDetailsScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkDetails
>

function NetworkDetailsScreen(): JSX.Element {
  const { goBack } = useNavigation<NetworkDetailsScreenProps['navigation']>()
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()

  return <NetworkDetails chainId={params.chainId} goBack={goBack} />
}

type NetworkAddEditScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkAddEdit
>

function NetworkAddEditScreen(): JSX.Element {
  const { params } = useRoute<NetworkAddEditScreenProps['route']>()
  const { goBack } = useNavigation<NetworkAddEditScreenProps['navigation']>()

  return (
    <AddEditNetwork
      mode={params.mode}
      network={params.network}
      onClose={() => goBack()}
    />
  )
}

export default memo(WalletScreenStack)
