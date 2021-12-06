import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, BackHandler, Modal} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import SendReceiveBottomSheet from 'screens/portfolio/SendReceiveBottomSheet';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import AppNavigation from 'navigation/AppNavigation';
import {SelectedTokenContextProvider} from 'contexts/SelectedTokenContext';
import ActivityDetailBottomSheet from 'screens/activity/ActivityDetailBottomSheet';
import {SelectedAccountContextProvider} from 'contexts/SelectedAccountContext';
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
import {useFocusEffect} from '@react-navigation/native';
import SignOutBottomSheet from 'screens/mainView/SignOutBottomSheet';
import {createStackNavigator} from '@react-navigation/stack';
import ReceiveToken2 from 'screens/receive/ReceiveToken2';
import SendTokenSelector from 'screens/send/SendTokenSelector';
import HeaderAccountSelector from 'components/HeaderAccountSelector';

type Props = {
  onExit: () => void;
};

type RootStackParamList = {
  [AppNavigation.Wallet.Drawer]: undefined;
  [AppNavigation.Wallet.SearchScreen]: undefined;
  [AppNavigation.Wallet.AddCustomToken]: undefined;
  [AppNavigation.Wallet.CurrencySelector]: undefined;
  [AppNavigation.Wallet.SecurityPrivacy]: undefined;
  [AppNavigation.Wallet.Legal]: undefined;
  [AppNavigation.Wallet.ReceiveTokens]: undefined;
  [AppNavigation.Wallet.SendTokens]: undefined;
  [AppNavigation.Modal.SendReceiveBottomSheet]: undefined;
  [AppNavigation.Modal.AccountBottomSheet]: undefined;
  [AppNavigation.Modal.TransactionDetailBottomSheet]: undefined;
  [AppNavigation.Modal.ReceiveOnlyBottomSheet]: undefined;
  [AppNavigation.Modal.SignOut]: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();

const focusEvent = 'change';
const TIMEOUT = 3000;

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
  const handleAppStateChange = async (nextAppState: any) => {
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
      console.log('getting here coming back from background');
      setShowSecurityModal(true);
      resetHDIndices().then(() => {
        //ignored
      });
    }
    appState.current = nextAppState;
  };

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
          name={AppNavigation.Modal.SendReceiveBottomSheet}
          component={SendReceiveBottomSheet}
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
      </RootStack.Group>
    );
  }, []);

  const CurrencySelectorScreen = () => {
    return (
      <CurrencySelector
        onSelectedCurrency={code => setSelectedCurrency(code)}
      />
    );
  };

  return (
    <SelectedAccountContextProvider>
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
              presentation: 'card',
              headerShown: true,
              headerBackTitleVisible: false,
              headerTitleAlign: 'center',
              headerTitle: () => <HeaderAccountSelector />,
            }}
            component={SendTokenSelector}
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
              ...MainHeaderOptions('Currency'),
            }}
            name={AppNavigation.Wallet.CurrencySelector}
            component={CurrencySelectorScreen}
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
                resetNavToEnterMnemonic();
                setShowSecurityModal(false);
              });
            }}
            onLoginSuccess={() => {
              setShowSecurityModal(false);
            }}
          />
        </Modal>
      </SelectedTokenContextProvider>
    </SelectedAccountContextProvider>
  );
}

export default memo(WalletScreenStack);
