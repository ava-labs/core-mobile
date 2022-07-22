import React, { memo, useMemo } from 'react'
import { BackHandler, Modal } from 'react-native'
import {
  NavigatorScreenParams,
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet'
import AppNavigation from 'navigation/AppNavigation'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
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
import WebViewScreen from 'screens/webview/WebViewScreen'
import SignOutBottomSheet from 'screens/mainView/SignOutBottomSheet'
import {
  createStackNavigator,
  StackNavigationOptions
} from '@react-navigation/stack'
import ReceiveScreenStack, {
  ReceiveStackParamList
} from 'navigation/wallet/ReceiveScreenStack'
import SelectTokenBottomSheet from 'screens/swap/SelectTokenBottomSheet'
import SendScreenStack, {
  SendStackParamList
} from 'navigation/wallet/SendScreenStack'
import AccountDropdown from 'screens/portfolio/account/AccountDropdown'
import SwapScreenStack, {
  SwapStackParamList
} from 'navigation/wallet/SwapScreenStack'
import AddressBookStack, {
  AddressBookStackParamList
} from 'navigation/wallet/AddressBookStack'
import TokenDetail from 'screens/watchlist/TokenDetail'
import ActivityDetail from 'screens/activity/ActivityDetail'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'
import OwnedTokenDetail from 'screens/portfolio/OwnedTokenDetail'
import BridgeScreenStack from 'navigation/wallet/BridgeScreenStack'
import NFTScreenStack, {
  NFTStackParamList
} from 'navigation/wallet/NFTScreenStack'
import NftManage from 'screens/nft/NftManage'
import SharedBridgeTransactionStatus from 'screens/shared/BridgeTransactionStatus'
import NetworkManager from 'screens/network/NetworkManager'
import NetworkDetails from 'screens/network/NetworkDetails'
import AvaButton from 'components/AvaButton'
import StarSVG from 'components/svg/StarSVG'
import { selectFavoriteNetworks, toggleFavorite } from 'store/network'
import { onAppUnlocked, selectIsLocked } from 'store/app'
import { Network } from '@avalabs/chains-sdk'
import AddSVG from 'components/svg/AddSVG'
import AddEditNetwork, {
  AddEditNetworkProps
} from 'screens/network/AddEditNetwork'
import { Transaction } from 'store/transaction'
import RpcMethodsUI from 'screens/rpc/RpcMethodsUI'
import { useDeepLinking } from 'navigation/useDeepLinking'
import { BridgeStackParamList } from './wallet/BridgeScreenStack'
import {
  BridgeTransactionStatusParams,
  EditGasLimitParams,
  TokenSelectParams,
  WalletScreenProps
} from './types'
import AdvancedStackScreen from './wallet/AdvancedStackScreen'

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
  [AppNavigation.Wallet.NetworkDetails]: { network: Network }
  [AppNavigation.Wallet.NetworkAddEdit]: AddEditNetworkProps
  [AppNavigation.Wallet.Advanced]: undefined
  [AppNavigation.Wallet.SecurityPrivacy]:
    | NavigatorScreenParams<SecurityStackParamList>
    | undefined
  [AppNavigation.Wallet.Legal]: undefined
  [AppNavigation.Bridge.BridgeTransactionStatus]: BridgeTransactionStatusParams
  [AppNavigation.Wallet.Bridge]: NavigatorScreenParams<BridgeStackParamList>
  [AppNavigation.Modal.AccountDropDown]: undefined
  [AppNavigation.Modal.AccountBottomSheet]: undefined
  [AppNavigation.Modal.SignOut]: undefined
  [AppNavigation.Modal.SelectToken]: TokenSelectParams
  [AppNavigation.Modal.EditGasLimit]: EditGasLimitParams
  [AppNavigation.Modal.RpcMethodsUI]: undefined
}

const WalletScreenS = createStackNavigator<WalletScreenStackParams>()

const SignOutBottomSheetScreen = () => {
  const { signOut } = useApplicationContext().appHook

  const doSwitchWallet = (): void => {
    signOut().then()
  }

  return <SignOutBottomSheet onConfirm={doSwitchWallet} />
}

function WalletScreenStack(props: Props | Readonly<Props>) {
  const dispatch = useDispatch()
  const showSecurityModal = useSelector(selectIsLocked)
  useDeepLinking(!showSecurityModal)
  const context = useApplicationContext()
  const { signOut } = context.appHook

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
    }, [])
  )

  const onExit = (): void => {
    props.onExit()
  }

  const BottomSheetGroup = useMemo(() => {
    return (
      <WalletScreenS.Group screenOptions={{ presentation: 'transparentModal' }}>
        <WalletScreenS.Screen
          name={AppNavigation.Modal.RpcMethodsUI}
          component={RpcMethodsUI}
        />
        <WalletScreenS.Screen
          options={{
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 0 } },
              close: { animation: 'timing', config: { duration: 300 } }
            }
          }}
          name={AppNavigation.Modal.AccountDropDown}
          component={AccountDropdownComp}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.AccountBottomSheet}
          component={AccountBottomSheet}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SignOut}
          component={SignOutBottomSheetScreen}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SelectToken}
          component={SelectTokenBottomSheet}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.EditGasLimit}
          component={EditGasLimit}
        />
      </WalletScreenS.Group>
    )
  }, [])

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
            ...SubHeaderOptions('Transaction Details')
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
          options={{
            headerShown: false
          }}
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
              __DEV__ ? <AddNetworkAction /> : undefined //TODO: not in current project scope, enable later
            ) as Partial<StackNavigationOptions>
          }
          name={AppNavigation.Wallet.NetworkSelector}
          component={NetworkSelectorScreen}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('', false, <ToggleFavoriteNetwork />)
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
          options={{
            ...MainHeaderOptions('Legal')
          }}
          name={AppNavigation.Wallet.Legal}
          component={WebViewScreen}
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
        {BottomSheetGroup}
      </WalletScreenS.Navigator>
      <Modal visible={showSecurityModal} animationType={'slide'} animated>
        <PinOrBiometryLogin
          onSignInWithRecoveryPhrase={() => {
            signOut().then(() => {
              context.appNavHook.resetNavToEnterMnemonic()
            })
          }}
          onLoginSuccess={() => {
            dispatch(onAppUnlocked())
          }}
        />
      </Modal>
    </>
  )
}

type AccountDropDownNavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.AccountDropDown
>['navigation']

const AccountDropdownComp = () => {
  const navigation = useNavigation<AccountDropDownNavigationProp>()
  return (
    <AccountDropdown
      onAddEditAccounts={() => {
        navigation.goBack()
        navigation.navigate(AppNavigation.Modal.AccountBottomSheet)
      }}
    />
  )
}
type EditGasLimitScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>

const EditGasLimit = () => {
  const { goBack } = useNavigation<EditGasLimitScreenProps['navigation']>()
  const { params } = useRoute<EditGasLimitScreenProps['route']>()

  const onSave = (newGasLimit: number) => params.onSave(newGasLimit)

  return (
    <EditGasLimitBottomSheet
      onClose={goBack}
      onSave={onSave}
      gasLimit={params.gasLimit}
      gasPrice={params.gasPrice}
    />
  )
}

type BridgeTransactionStatusScreenProps = WalletScreenProps<
  typeof AppNavigation.Bridge.BridgeTransactionStatus
>

const BridgeTransactionStatus = () => {
  const { setOptions } =
    useNavigation<BridgeTransactionStatusScreenProps['navigation']>()

  const { txHash } =
    useRoute<BridgeTransactionStatusScreenProps['route']>().params

  return (
    <SharedBridgeTransactionStatus setNavOptions={setOptions} txHash={txHash} />
  )
}

type NetworkSelectorScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkSelector
>

function NetworkSelectorScreen() {
  const { navigate } = useNavigation<NetworkSelectorScreenProps['navigation']>()

  function showNetworkDetails(network: Network) {
    navigate(AppNavigation.Wallet.NetworkDetails, {
      network: network
    })
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
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()

  return <NetworkDetails network={params.network} />
}

type NetworkAddEditScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkAddEdit
>

function NetworkAddEditScreen() {
  const { params } = useRoute<NetworkAddEditScreenProps['route']>()
  const { goBack } = useNavigation<NetworkAddEditScreenProps['navigation']>()

  return <AddEditNetwork mode={params.mode} onClose={() => goBack()} />
}

function ToggleFavoriteNetwork() {
  const {
    network: { chainId }
  } = useRoute<NetworkDetailsScreenProps['route']>().params
  const favoriteNetworks = useSelector(selectFavoriteNetworks)
  const dispatch = useDispatch()
  const isFavorite = favoriteNetworks.some(
    network => network.chainId === chainId
  )

  return (
    <AvaButton.Icon onPress={() => dispatch(toggleFavorite(chainId))}>
      <StarSVG selected={isFavorite} />
    </AvaButton.Icon>
  )
}

export default memo(WalletScreenStack)
