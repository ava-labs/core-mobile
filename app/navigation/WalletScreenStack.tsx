import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {AppState, BackHandler, Modal} from 'react-native'
import {useApplicationContext} from 'contexts/ApplicationContext'
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet'
import AppNavigation from 'navigation/AppNavigation'
import {SelectedTokenContextProvider} from 'contexts/SelectedTokenContext'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BiometricsSDK from 'utils/BiometricsSDK'
import moment from 'moment'
import DrawerScreenStack from 'navigation/wallet/DrawerScreenStack'
import TokenManagement from 'screens/tokenManagement/TokenManagement'
import AddCustomToken from 'screens/tokenManagement/AddCustomToken'
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector'
import SecurityPrivacyStackScreen from 'navigation/wallet/SecurityPrivacyStackScreen'
import {MainHeaderOptions, SubHeaderOptions} from 'navigation/NavUtils'
import WebViewScreen from 'screens/webview/WebViewScreen'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import SignOutBottomSheet from 'screens/mainView/SignOutBottomSheet'
import {
  createStackNavigator,
  StackNavigationProp
} from '@react-navigation/stack'
import ReceiveToken2 from 'screens/receive/ReceiveToken2'
import NetworkSelector from 'network/NetworkSelector'
import SelectTokenBottomSheet from 'screens/swap/SelectTokenBottomSheet'
import SendScreenStack from 'navigation/wallet/SendScreenStack'
import {
  currentSelectedCurrency$,
  TokenWithBalance
} from '@avalabs/wallet-react-components'
import AccountDropdown from 'screens/portfolio/account/AccountDropdown'
import SwapScreenStack from 'navigation/wallet/SwapScreenStack'
import AddressBookStack from 'navigation/wallet/AddressBookStack'
import {Contact} from 'Repo'
import TokenDetail from 'screens/watchlist/TokenDetail'
import {TxType} from 'screens/activity/ActivityList'
import ActivityDetail from 'screens/activity/ActivityDetail'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'
import OwnedTokenDetail from 'screens/portfolio/OwnedTokenDetail'
import BridgeScreenStack from 'navigation/wallet/BridgeScreenStack'
import NFTScreenStack from 'navigation/wallet/NFTScreenStack'
import {NFTItemData} from 'screens/nft/NftCollection'
import NftManage from 'screens/nft/NftManage'
import BridgeTransactionStatus from 'screens/bridge/BridgeTransactionStatus'

type Props = {
  onExit: () => void
}

export type RootStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined
  [AppNavigation.Wallet.TokenManagement]: undefined
  [AppNavigation.Wallet.AddCustomToken]: undefined
  [AppNavigation.Wallet.AddressBook]: undefined
  [AppNavigation.Wallet.CurrencySelector]: undefined
  [AppNavigation.Wallet.SecurityPrivacy]: undefined
  [AppNavigation.Wallet.Legal]: undefined
  [AppNavigation.Wallet.ReceiveTokens]: undefined
  [AppNavigation.Wallet.SendTokens]:
    | {token?: TokenWithBalance; contact?: Contact}
    | undefined
  [AppNavigation.Wallet.Swap]: undefined
  [AppNavigation.Wallet.NFTDetails]: {nft: NFTItemData}
  [AppNavigation.Wallet.NFTManage]: undefined
  [AppNavigation.Wallet.NetworkSelector]: undefined
  [AppNavigation.Wallet.TokenDetail]: {address?: string} | undefined
  [AppNavigation.Wallet.OwnedTokenDetail]: {tokenId?: string} | undefined
  [AppNavigation.Wallet.ActivityDetail]: {tx?: TxType}
  [AppNavigation.Wallet.Bridge]: undefined
  [AppNavigation.Bridge.BridgeTransactionStatus]: {
    blockchain: string
    txHash: string
    txTimestamp: string
  }
  [AppNavigation.Modal.AccountBottomSheet]: undefined
  [AppNavigation.Modal.AccountDropDown]: undefined
  [AppNavigation.Modal.ReceiveOnlyBottomSheet]: undefined
  [AppNavigation.Modal.SignOut]: undefined
  [AppNavigation.Modal.SelectToken]: undefined
  [AppNavigation.Modal.EditGasLimit]: {
    onSave: (newGasLimit: number) => void
    gasLimit: string
    networkFee: string
  }
}

const RootStack = createStackNavigator<RootStackParamList>()

const focusEvent = 'change'
const TIMEOUT = 5000

const SignOutBottomSheetScreen = () => {
  const {signOut} = useApplicationContext().appHook

  const doSwitchWallet = (): void => {
    signOut().then()
  }

  return <SignOutBottomSheet onConfirm={doSwitchWallet} />
}

function WalletScreenStack(props: Props | Readonly<Props>) {
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const appState = useRef(AppState.currentState)
  const context = useApplicationContext()
  const {signOut, setSelectedCurrency} = context.appHook

  /**
   * This UseEffect handles subscription to
   * AppState listener which tells us if the app is
   * backgrounded or foregrounded.
   */
  useEffect(() => {
    AppState.addEventListener(focusEvent, handleAppStateChange)

    return () => {
      AppState.removeEventListener(focusEvent, handleAppStateChange)
    }
  }, [])

  /**
   * Handles AppState change. When app is being backgrounded we save the current
   * timestamp.
   *
   * When returning to the foreground take the time the apps was suspended, check the propper
   * states, see if AccessType is set (that determines if user has logged in or not)
   * and we check IF the diff between "now" and the suspended time is greater then our
   * TIMEOUT of 5 sec.
   * @param nextAppState
   */
  const handleAppStateChange = useCallback(async (nextAppState: any) => {
    const value = await BiometricsSDK.getAccessType()
    const timeAppWasSuspended = await AsyncStorage.getItem('TIME_APP_SUSPENDED')
    const suspended = timeAppWasSuspended ?? moment().toISOString()

    const overTimeOut = moment().diff(moment(suspended)) >= TIMEOUT

    if (
      (appState.current === 'active' && nextAppState.match(/background/)) ||
      (appState.current === 'inactive' && nextAppState.match(/background/))
    ) {
      // this condition calls when app is in background mode
      // here you can detect application is going to background or inactive.
      await AsyncStorage.setItem('TIME_APP_SUSPENDED', moment().toISOString())
    } else if (
      appState.current.match(/background/) &&
      nextAppState === 'active' &&
      value &&
      overTimeOut
    ) {
      // this condition calls when app is in foreground mode
      // here you can detect application is in active state again.
      setShowSecurityModal(true)
    }
    appState.current = nextAppState
  }, [])

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
      <RootStack.Group screenOptions={{presentation: 'transparentModal'}}>
        <RootStack.Screen
          options={{
            transitionSpec: {
              open: {animation: 'timing', config: {duration: 0}},
              close: {animation: 'timing', config: {duration: 300}}
            }
          }}
          name={AppNavigation.Modal.AccountDropDown}
          component={AccountDropdownComp}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.AccountBottomSheet}
          component={AccountBottomSheet}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.SignOut}
          component={SignOutBottomSheetScreen}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.SelectToken}
          component={SelectTokenBottomSheet}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.EditGasLimit}
          component={EditGasLimitBottomSheet}
        />
      </RootStack.Group>
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
      <RootStack.Navigator
        screenOptions={{
          headerShown: false
        }}>
        <RootStack.Screen
          name={AppNavigation.Wallet.Drawer}
          component={DrawerScreenStack}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('Manage token list')
          }}
          name={AppNavigation.Wallet.TokenManagement}
          component={TokenManagement}
        />
        <RootStack.Screen
          name={AppNavigation.Wallet.SendTokens}
          options={{
            headerShown: false
          }}
          component={SendScreenStack}
        />
        <RootStack.Screen name={AppNavigation.Wallet.ReceiveTokens}>
          {props => <ReceiveToken2 showBackButton {...props} />}
        </RootStack.Screen>
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('Add Custom Token')
          }}
          name={AppNavigation.Wallet.AddCustomToken}
          component={AddCustomToken}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('')
          }}
          name={AppNavigation.Wallet.TokenDetail}
          component={TokenDetail}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('')
          }}
          name={AppNavigation.Wallet.OwnedTokenDetail}
          component={OwnedTokenDetail}
        />
        <RootStack.Screen
          options={{
            ...SubHeaderOptions('Transaction Details')
          }}
          name={AppNavigation.Wallet.ActivityDetail}
          component={ActivityDetail}
        />
        <RootStack.Screen
          options={{
            headerShown: false
          }}
          name={AppNavigation.Wallet.Swap}
          component={SwapScreenStack}
        />
        <RootStack.Screen
          options={{
            headerShown: false
          }}
          name={AppNavigation.Wallet.NFTDetails}
          component={NFTScreenStack}
        />
        <RootStack.Screen
          options={{
            headerShown: false
          }}
          name={AppNavigation.Wallet.NFTManage}
          component={NftManage}
        />
        <RootStack.Screen
          options={{
            headerShown: false
          }}
          name={AppNavigation.Wallet.AddressBook}
          component={AddressBookStack}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('Currency')
          }}
          name={AppNavigation.Wallet.CurrencySelector}
          component={CurrencySelectorScreen}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('Network')
          }}
          name={AppNavigation.Wallet.NetworkSelector}
          component={NetworkSelector}
        />
        <RootStack.Screen
          name={AppNavigation.Wallet.SecurityPrivacy}
          component={SecurityPrivacyStackScreen}
        />
        <RootStack.Screen
          options={{
            ...MainHeaderOptions('Legal')
          }}
          name={AppNavigation.Wallet.Legal}
          component={WebViewScreen}
        />
        <RootStack.Screen
          options={{
            ...SubHeaderOptions('Transaction Details')
          }}
          name={AppNavigation.Bridge.BridgeTransactionStatus}
          component={BridgeTransactionStatus}
        />
        <RootStack.Screen
          name={AppNavigation.Wallet.Bridge}
          component={BridgeScreenStack}
        />
        {BottomSheetGroup}
      </RootStack.Navigator>
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

const AccountDropdownComp = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  return (
    <AccountDropdown
      onAddEditAccounts={() => {
        navigation.goBack()
        navigation.navigate(AppNavigation.Modal.AccountBottomSheet)
      }}
    />
  )
}

export default memo(WalletScreenStack)
