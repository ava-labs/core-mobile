import React, { memo } from 'react'
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
import SendScreenStack, {
  SendStackParamList
} from 'navigation/wallet/SendScreenStack'
import SwapScreenStack, {
  SwapStackParamList
} from 'navigation/wallet/SwapScreenStack'
import AddressBookStack, {
  AddressBookStackParamList
} from 'navigation/wallet/AddressBookStack'
import TokenDetail from 'screens/watchlist/TokenDetail'
import ActivityDetail from 'screens/activity/ActivityDetail'
import OwnedTokenDetail from 'screens/portfolio/OwnedTokenDetail'
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
import { Transaction } from 'store/transaction'
import LegalStackScreen, {
  LegalStackParamList
} from 'navigation/wallet/LegalStackScreen'
import { NetworkDetailsAction } from 'screens/network/NetworkDetailsAction'
import CaptureDappQR from 'screens/shared/CaptureDappQR'
import { ChainID } from 'store/network'
import { BridgeStackParamList } from '../wallet/BridgeScreenStack'
import {
  AddEthereumChainParams,
  BridgeAssetParams,
  BridgeTransactionStatusParams,
  CreateRemoveContactParams,
  EditGasLimitParams,
  QRCodeParams,
  SelectAccountParams,
  SendTransactionParams,
  SessionProposalParams,
  SignMessageParams,
  SignTransactionParams,
  SwitchEthereumChainParams,
  TokenSelectParams,
  UpdateContactParams,
  WalletScreenProps,
  SignMessageV2Params,
  SessionProposalV2Params,
  CreateRemoveContactV2Params,
  UpdateContactV2Params,
  SelectAccountV2Params,
  AddEthereumChainV2Params,
  SwitchEthereumChainV2Params,
  BridgeAssetV2Params,
  SignTransactionV2Params
} from '../types'
import AdvancedStackScreen, {
  AdvancedStackParamList
} from '../wallet/AdvancedStackScreen'
import { createModals } from './createModals'

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
  [AppNavigation.Wallet.AddCustomToken]: undefined
  [AppNavigation.Wallet.TokenDetail]: { tokenId: string }
  [AppNavigation.Wallet.OwnedTokenDetail]: { tokenId: string }
  [AppNavigation.Wallet.ActivityDetail]: {
    tx?: Transaction
  }
  [AppNavigation.Wallet.Swap]:
    | NavigatorScreenParams<SwapStackParamList>
    | undefined
  [AppNavigation.Wallet.NFTDetails]: NavigatorScreenParams<NFTStackParamList>
  [AppNavigation.Wallet.NFTManage]: undefined
  [AppNavigation.Wallet.AddressBook]:
    | NavigatorScreenParams<AddressBookStackParamList>
    | undefined
  [AppNavigation.Wallet.CurrencySelector]: undefined
  [AppNavigation.Wallet.NetworkSelector]: undefined
  [AppNavigation.Wallet.NetworkDetails]: NetworkDetailsProps
  [AppNavigation.Wallet.NetworkAddEdit]: AddEditNetworkProps
  [AppNavigation.Wallet.Advanced]: NavigatorScreenParams<AdvancedStackParamList>
  [AppNavigation.Wallet.SecurityPrivacy]:
    | NavigatorScreenParams<SecurityStackParamList>
    | undefined
  [AppNavigation.Wallet.Legal]: NavigatorScreenParams<LegalStackParamList>
  [AppNavigation.Bridge.BridgeTransactionStatus]: BridgeTransactionStatusParams
  [AppNavigation.Wallet.Bridge]: NavigatorScreenParams<BridgeStackParamList>
  [AppNavigation.Wallet.QRCode]: QRCodeParams
  [AppNavigation.Modal.AccountDropDown]: undefined
  [AppNavigation.Modal.AccountBottomSheet]: undefined
  [AppNavigation.Modal.SignOut]: undefined
  [AppNavigation.Modal.SelectToken]: TokenSelectParams
  [AppNavigation.Modal.EditGasLimit]: EditGasLimitParams
  // rpc prompts for wallet connect v1
  [AppNavigation.Modal.SessionProposal]: SessionProposalParams
  [AppNavigation.Modal.CreateRemoveContact]: CreateRemoveContactParams
  [AppNavigation.Modal.UpdateContact]: UpdateContactParams
  [AppNavigation.Modal.SelectAccount]: SelectAccountParams
  [AppNavigation.Modal.SignTransaction]: SignTransactionParams
  [AppNavigation.Modal.SendTransaction]: SendTransactionParams
  [AppNavigation.Modal.SignMessage]: SignMessageParams
  [AppNavigation.Modal.BridgeAsset]: BridgeAssetParams
  [AppNavigation.Modal.AddEthereumChain]: AddEthereumChainParams
  [AppNavigation.Modal.SwitchEthereumChain]: SwitchEthereumChainParams
  // rpc prompts for wallet connect v2
  [AppNavigation.Modal.SessionProposalV2]: SessionProposalV2Params
  [AppNavigation.Modal.SignMessageV2]: SignMessageV2Params
  [AppNavigation.Modal.CreateRemoveContactV2]: CreateRemoveContactV2Params
  [AppNavigation.Modal.UpdateContactV2]: UpdateContactV2Params
  [AppNavigation.Modal.SelectAccountV2]: SelectAccountV2Params
  [AppNavigation.Modal.AddEthereumChainV2]: AddEthereumChainV2Params
  [AppNavigation.Modal.SwitchEthereumChainV2]: SwitchEthereumChainV2Params
  [AppNavigation.Modal.BridgeAssetV2]: BridgeAssetV2Params
  [AppNavigation.Modal.SignTransactionV2]: SignTransactionV2Params
}

const WalletScreenS = createStackNavigator<WalletScreenStackParams>()

export type WalletScreenSType = typeof WalletScreenS

export const SignOutModalScreen = () => {
  const { signOut } = useApplicationContext().appHook

  const doSwitchWallet = (): void => {
    signOut().then()
  }

  return <SignOutModal onConfirm={doSwitchWallet} />
}

function WalletScreenStack(props: Props | Readonly<Props>) {
  const context = useApplicationContext()

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!context.appNavHook.navigation.current?.canGoBack()) {
          onExit()
          return true
        } else {
          return false
        }
      }
      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const onExit = (): void => {
    props.onExit()
  }

  return (
    <>
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
            ...MainHeaderOptions('Manage token list')
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
          name={AppNavigation.Wallet.ReceiveTokens}
          component={ReceiveScreenStack}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('Add Custom Token')
          }}
          name={AppNavigation.Wallet.AddCustomToken}
          component={AddCustomToken}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('')
          }}
          name={AppNavigation.Wallet.TokenDetail}
          component={TokenDetail}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('')
          }}
          name={AppNavigation.Wallet.OwnedTokenDetail}
          component={OwnedTokenDetail}
        />
        <WalletScreenS.Screen
          options={{
            ...SubHeaderOptions('Transaction Details', undefined, 'header_back')
          }}
          name={AppNavigation.Wallet.ActivityDetail}
          component={ActivityDetail}
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
            headerShown: false
          }}
          name={AppNavigation.Wallet.NFTDetails}
          component={NFTScreenStack}
        />
        <WalletScreenS.Screen
          options={MainHeaderOptions('')}
          name={AppNavigation.Wallet.NFTManage}
          component={NftManage}
        />
        <WalletScreenS.Screen
          options={{
            headerShown: false
          }}
          name={AppNavigation.Wallet.AddressBook}
          component={AddressBookStack}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('Currency')
          }}
          name={AppNavigation.Wallet.CurrencySelector}
          component={CurrencySelector}
        />
        <WalletScreenS.Screen
          options={
            MainHeaderOptions(
              '',
              false,
              <AddNetworkAction />
            ) as Partial<StackNavigationOptions>
          }
          name={AppNavigation.Wallet.NetworkSelector}
          component={NetworkSelectorScreen}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('', false, <NetworkDetailsAction />)
          }}
          name={AppNavigation.Wallet.NetworkDetails}
          component={NetworkDetailsScreen}
        />
        <WalletScreenS.Screen
          options={MainHeaderOptions('')}
          name={AppNavigation.Wallet.NetworkAddEdit}
          component={NetworkAddEditScreen}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Wallet.Advanced}
          component={AdvancedStackScreen}
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
            ...SubHeaderOptions('Transaction Details')
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
        {createModals(WalletScreenS)}
      </WalletScreenS.Navigator>
    </>
  )
}

type BridgeTransactionStatusScreenProps = WalletScreenProps<
  typeof AppNavigation.Bridge.BridgeTransactionStatus
>

const BridgeTransactionStatus = () => {
  const { txHash } =
    useRoute<BridgeTransactionStatusScreenProps['route']>().params

  return <SharedBridgeTransactionStatus txHash={txHash} />
}

type NetworkSelectorScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkSelector
>

function NetworkSelectorScreen() {
  const { navigate, goBack } =
    useNavigation<NetworkSelectorScreenProps['navigation']>()

  function showNetworkDetails(chainId: ChainID) {
    navigate(AppNavigation.Wallet.NetworkDetails, { chainId, goBack })
  }

  return <NetworkManager onShowInfo={showNetworkDetails} />
}

const AddNetworkAction = () => {
  const { navigate } = useNavigation<NetworkSelectorScreenProps['navigation']>()
  return (
    <AvaButton.Icon
      onPress={() =>
        navigate(AppNavigation.Wallet.NetworkAddEdit, {
          mode: 'create'
        })
      }>
      <AddSVG hideCircle />
    </AvaButton.Icon>
  )
}

type NetworkDetailsScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkDetails
>

function NetworkDetailsScreen() {
  const { goBack } = useNavigation<NetworkDetailsScreenProps['navigation']>()
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()

  return <NetworkDetails chainId={params.chainId} goBack={goBack} />
}

type NetworkAddEditScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkAddEdit
>

function NetworkAddEditScreen() {
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
