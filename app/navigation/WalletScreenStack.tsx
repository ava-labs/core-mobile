import React, { memo, useEffect, useMemo, useState } from 'react'
import { BackHandler, Modal } from 'react-native'
import {
  NavigatorScreenParams,
  useFocusEffect,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import { useSelector, useDispatch } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet'
import AppNavigation from 'navigation/AppNavigation'
import { SelectedTokenContextProvider } from 'contexts/SelectedTokenContext'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  currentSelectedCurrency$,
  TokenWithBalance,
  TransactionERC20,
  TransactionNormal
} from '@avalabs/wallet-react-components'
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
import { createStackNavigator } from '@react-navigation/stack'
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
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import { toggleFavorite, Network, selectFavoriteNetworks } from 'store/network'
import { BridgeStackParamList } from './wallet/BridgeScreenStack'
import {
  BridgeTransactionStatusParams,
  EditGasLimitParams,
  WalletScreenProps
} from './types'

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
  [AppNavigation.Wallet.TokenDetail]: { address: string }
  [AppNavigation.Wallet.OwnedTokenDetail]: { tokenId: string }
  [AppNavigation.Wallet.ActivityDetail]: {
    tx?: TransactionNormal | TransactionERC20
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
  [AppNavigation.Wallet.SecurityPrivacy]:
    | NavigatorScreenParams<SecurityStackParamList>
    | undefined
  [AppNavigation.Wallet.Legal]: undefined
  [AppNavigation.Bridge.BridgeTransactionStatus]: BridgeTransactionStatusParams
  [AppNavigation.Wallet.Bridge]: NavigatorScreenParams<BridgeStackParamList>
  [AppNavigation.Modal.AccountDropDown]: undefined
  [AppNavigation.Modal.AccountBottomSheet]: undefined
  [AppNavigation.Modal.SignOut]: undefined
  [AppNavigation.Modal.SelectToken]: {
    onTokenSelected: (token: TokenWithBalance) => void
  }
  [AppNavigation.Modal.EditGasLimit]: EditGasLimitParams
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
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const context = useApplicationContext()
  const { signOut, setSelectedCurrency } = context.appHook
  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 5000,
    getTime: async () => AsyncStorage.getItem('TIME_APP_SUSPENDED'),
    setTime: async time => AsyncStorage.setItem('TIME_APP_SUSPENDED', time)
  })

  useEffect(() => {
    if (timeoutPassed) {
      setShowSecurityModal(true)
    }
  }, [timeoutPassed])

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

  const CurrencySelectorScreen = () => {
    return (
      <CurrencySelector
        onSelectedCurrency={code => {
          currentSelectedCurrency$.next(code)
          setSelectedCurrency(code)
        }}
      />
    )
  }

  return (
    <SelectedTokenContextProvider>
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
          component={CurrencySelectorScreen}
        />
        <WalletScreenS.Screen
          options={{
            ...MainHeaderOptions('')
          }}
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
              setShowSecurityModal(false)
            })
          }}
          onLoginSuccess={() => {
            setShowSecurityModal(false)
          }}
        />
      </Modal>
    </SelectedTokenContextProvider>
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
      networkFee={params.networkFee}
      gasLimit={params.gasLimit}
    />
  )
}

type BridgeTransactionStatusScreenProps = WalletScreenProps<
  typeof AppNavigation.Bridge.BridgeTransactionStatus
>

const BridgeTransactionStatus = () => {
  const { setOptions } =
    useNavigation<BridgeTransactionStatusScreenProps['navigation']>()

  const { blockchain, txHash, txTimestamp } =
    useRoute<BridgeTransactionStatusScreenProps['route']>().params

  return (
    <SharedBridgeTransactionStatus
      setNavOptions={setOptions}
      blockchain={blockchain}
      txHash={txHash}
      txTimestamp={txTimestamp}
    />
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

type NetworkDetailsScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkDetails
>

function NetworkDetailsScreen() {
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()

  return <NetworkDetails network={params.network} />
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
