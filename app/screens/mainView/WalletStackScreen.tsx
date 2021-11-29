import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, BackHandler, Modal} from 'react-native';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {createStackNavigator} from '@react-navigation/stack';
import SendReceiveBottomSheet from 'screens/portfolio/SendReceiveBottomSheet';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import AppNavigation from 'navigation/AppNavigation';
import SearchView from 'screens/search/SearchView';
import AddCustomToken from 'screens/search/AddCustomToken';
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector';
import {SelectedTokenContextProvider} from 'contexts/SelectedTokenContext';
import SecurityPrivacyStackScreen from 'navigation/SecurityPrivacyStackScreen';
import WebViewScreen from 'screens/webview/WebViewScreen';
import ActivityDetailBottomSheet from 'screens/activity/ActivityDetailBottomSheet';
import {SelectedAccountContextProvider} from 'contexts/SelectedAccountContext';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricsSDK from 'utils/BiometricsSDK';
import moment from 'moment';
import ReceiveOnlyBottomSheet from 'screens/portfolio/receive/ReceiveOnlyBottomSheet';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {SelectedView} from 'AppViewModel';
import DrawerNavigator from 'navigation/DrawerNavigator';
import {useWalletSetup} from 'hooks/useWalletSetup';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const RootStack = createStackNavigator();

const focusEvent = 'change';
const TIMEOUT = 3000;

function WalletStackScreen(props: Props | Readonly<Props>) {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const context = useApplicationContext();
  const {resetHDIndices} = useWalletSetup();
  const {immediateLogout, setSelectedView} = context.appHook;

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
        onExit();
        return true;
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
          name={AppNavigation.Modal.ReceiveOnlyBottomSheet}
          component={ReceiveOnlyBottomSheet}
        />
      </RootStack.Group>
    );
  }, []);

  return (
    <SelectedAccountContextProvider>
      <SelectedTokenContextProvider>
        <NavigationContainer
          theme={context.navContainerTheme}
          independent={true}>
          <RootStack.Navigator
            screenOptions={{
              headerShown: false,
            }}>
            <RootStack.Group>
              <RootStack.Screen name={'Drawer'} component={DrawerNavigator} />
              <RootStack.Screen
                options={{
                  ...MainHeaderOptions('Manage token list'),
                }}
                name={AppNavigation.Wallet.SearchScreen}
                component={SearchView}
              />
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
                component={CurrencySelector}
              />
              <RootStack.Screen
                name={AppNavigation.Stack.Security}
                component={SecurityPrivacyStackScreen}
              />
              <RootStack.Screen
                options={{
                  ...MainHeaderOptions('Legal'),
                }}
                name={AppNavigation.Wallet.WebView}
                component={WebViewScreen}
              />
            </RootStack.Group>
            {BottomSheetGroup}
          </RootStack.Navigator>
        </NavigationContainer>
        <Modal visible={showSecurityModal} animationType={'slide'} animated>
          <PinOrBiometryLogin
            onSignInWithRecoveryPhrase={() => {
              immediateLogout().then(() => {
                setSelectedView(SelectedView.LoginWithMnemonic);
                setShowSecurityModal(false);
              });
            }}
            onEnterWallet={() => {
              setShowSecurityModal(false);
            }}
          />
        </Modal>
      </SelectedTokenContextProvider>
    </SelectedAccountContextProvider>
  );
}

export default memo(WalletStackScreen);
