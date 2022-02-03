import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, BackHandler, Modal} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import AppNavigation from 'navigation/AppNavigation';
import {SelectedTokenContextProvider} from 'contexts/SelectedTokenContext';
import ActivityDetailBottomSheet from 'screens/activity/ActivityDetailBottomSheet';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricsSDK from 'utils/BiometricsSDK';
import moment from 'moment';
import DrawerScreenStack from 'navigation/wallet/DrawerScreenStack';
import {useWalletSetup} from 'hooks/useWalletSetup';
import SearchView from 'screens/search/SearchView';
import AddCustomToken from 'screens/search/AddCustomToken';
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector';
import SecurityPrivacyStackScreen from 'navigation/wallet/SecurityPrivacyStackScreen';
import {MainHeaderOptions} from 'navigation/NavUtils';
import WebViewScreen from 'screens/webview/WebViewScreen';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import SignOutBottomSheet from 'screens/mainView/SignOutBottomSheet';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import ReceiveToken2 from 'screens/receive/ReceiveToken2';
import NetworkSelector from 'network/NetworkSelector';
import SelectTokenBottomSheet from 'screens/swap/SelectTokenBottomSheet';
import SwapFeesBottomSheet from 'screens/swap/components/SwapFeesBottomSheet';
import {SwapContextProvider} from 'contexts/SwapContext';
import SendScreenStack from 'navigation/wallet/SendScreenStack';
import {
  currentSelectedCurrency$,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';
import AccountDropdown from 'screens/portfolio/account/AccountDropdown';
import SwapScreenStack from 'navigation/wallet/SwapScreenStack';

type Props = {
  onExit: () => void;
};

export type RootStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined;
  [AppNavigation.Wallet.SearchScreen]: undefined;
  [AppNavigation.Wallet.AddCustomToken]: undefined;
  [AppNavigation.Wallet.CurrencySelector]: undefined;
  [AppNavigation.Wallet.SecurityPrivacy]: undefined;
  [AppNavigation.Wallet.Legal]: undefined;
  [AppNavigation.Wallet.ReceiveTokens]: undefined;
  [AppNavigation.Wallet.SendTokens]: {token?: TokenWithBalance} | undefined;
  [AppNavigation.Wallet.Swap]: undefined;
  [AppNavigation.Wallet.NetworkSelector]: undefined;
  [AppNavigation.Modal.AccountBottomSheet]: undefined;
  [AppNavigation.Modal.AccountDropDown]: undefined;
  [AppNavigation.Modal.TransactionDetailBottomSheet]: undefined;
  [AppNavigation.Modal.ReceiveOnlyBottomSheet]: undefined;
  [AppNavigation.Modal.SignOut]: undefined;
  [AppNavigation.Modal.SelectToken]: undefined;
  [AppNavigation.Modal.SwapTransactionFee]: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();

const focusEvent = 'change';
const TIMEOUT = 5000;

const SignOutBottomSheetScreen = () => {
  const {destroyWallet} = useWalletSetup();
  const {immediateLogout} = useApplicationContext().appHook;

  const doSwitchWallet = (): void => {
    destroyWallet();
    immediateLogout();
  };

  return <SignOutBottomSheet onConfirm={doSwitchWallet} />;
};

function WalletScreenStack(props: Props | Readonly<Props>) {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const context = useApplicationContext();
  const {resetHDIndices} = useWalletSetup();
  const {immediateLogout, resetNavToEnterMnemonic, setSelectedCurrency} =
    context.appHook;

  /**
   * This UseEffect handles subscription to
   * AppState listener which tells us if the app is
   * backgrounded or foregrounded.
   */
  useEffect(() => {
    AppState.addEventListener(focusEvent, handleAppStateChange);

    return () => {
      AppState.removeEventListener(focusEvent, handleAppStateChange);
    };
  }, []);

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
    const value = await BiometricsSDK.getAccessType();
    const timeAppWasSuspended = await AsyncStorage.getItem(
      'TIME_APP_SUSPENDED',
    );
    const suspended = timeAppWasSuspended ?? moment().toISOString();

    const overTimeOut = moment().diff(moment(suspended)) >= TIMEOUT;

    if (
      (appState.current === 'active' && nextAppState.match(/background/)) ||
      (appState.current === 'inactive' && nextAppState.match(/background/))
    ) {
      // this condition calls when app is in background mode
      // here you can detect application is going to background or inactive.
      await AsyncStorage.setItem('TIME_APP_SUSPENDED', moment().toISOString());
    } else if (
      appState.current.match(/background/) &&
      nextAppState === 'active' &&
      value &&
      overTimeOut
    ) {
      // this condition calls when app is in foreground mode
      // here you can detect application is in active state again.
      setShowSecurityModal(true);
      resetHDIndices().then(() => {
        //ignored
      });
    }
    appState.current = nextAppState;
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!context.appHook.navigation.current?.canGoBack()) {
          onExit();
          return true;
        } else {
          return false;
        }
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const onExit = (): void => {
    props.onExit();
  };

  const BottomSheetGroup = useMemo(() => {
    return (
      <RootStack.Group screenOptions={{presentation: 'transparentModal'}}>
        <RootStack.Screen
          options={{
            transitionSpec: {
              open: {animation: 'timing', config: {duration: 0}},
              close: {animation: 'timing', config: {duration: 300}},
            },
          }}
          name={AppNavigation.Modal.AccountDropDown}
          component={AccountDropdownComp}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.AccountBottomSheet}
          component={AccountBottomSheet}
        />
        <RootStack.Screen
          name={AppNavigation.Modal.TransactionDetailBottomSheet}
          component={ActivityDetailBottomSheet}
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
          name={AppNavigation.Modal.SwapTransactionFee}
          component={SwapFeesBottomSheet}
        />
      </RootStack.Group>
    );
  }, []);

  const CurrencySelectorScreen = () => {
    return (
      <CurrencySelector
        onSelectedCurrency={code => {
          currentSelectedCurrency$.next(code);
          setSelectedCurrency(code);
        }}
      />
    );
  };

  return (
    <SwapContextProvider>
      <SelectedTokenContextProvider>
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
          }}>
          <RootStack.Screen
            name={AppNavigation.Wallet.Drawer}
            component={DrawerScreenStack}
          />
          <RootStack.Screen
            options={{
              ...MainHeaderOptions('Manage token list'),
            }}
            name={AppNavigation.Wallet.SearchScreen}
            component={SearchView}
          />
          <RootStack.Screen
            name={AppNavigation.Wallet.SendTokens}
            options={{
              headerShown: false,
            }}
            component={SendScreenStack}
          />
          <RootStack.Screen name={AppNavigation.Wallet.ReceiveTokens}>
            {props => <ReceiveToken2 showBackButton {...props} />}
          </RootStack.Screen>
          <RootStack.Screen
            options={{
              ...MainHeaderOptions('Add Custom Token'),
            }}
            name={AppNavigation.Wallet.AddCustomToken}
            component={AddCustomToken}
          />
          <RootStack.Screen
            options={{
              presentation: 'card',
              headerShown: true,
              headerBackTitleVisible: false,
              headerTitleAlign: 'center',
              headerTitle: () => <HeaderAccountSelector />,
            }}
            name={AppNavigation.Wallet.Swap}
            component={SwapScreenStack}
          />
          <RootStack.Screen
            options={{
              ...MainHeaderOptions('Currency'),
            }}
            name={AppNavigation.Wallet.CurrencySelector}
            component={CurrencySelectorScreen}
          />
          <RootStack.Screen
            options={{
              ...MainHeaderOptions('Network'),
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
              ...MainHeaderOptions('Legal'),
            }}
            name={AppNavigation.Wallet.Legal}
            component={WebViewScreen}
          />
          {BottomSheetGroup}
        </RootStack.Navigator>
        <Modal visible={showSecurityModal} animationType={'slide'} animated>
          <PinOrBiometryLogin
            onSignInWithRecoveryPhrase={() => {
              immediateLogout().then(() => {
                resetNavToEnterMnemonic(context.appHook.navigation);
                setShowSecurityModal(false);
              });
            }}
            onLoginSuccess={() => {
              setShowSecurityModal(false);
            }}
          />
        </Modal>
      </SelectedTokenContextProvider>
    </SwapContextProvider>
  );
}

const AccountDropdownComp = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  return (
    <AccountDropdown
      onAddEditAccounts={() => {
        navigation.goBack();
        navigation.navigate(AppNavigation.Modal.AccountBottomSheet);
      }}
    />
  );
};

export default memo(WalletScreenStack);
