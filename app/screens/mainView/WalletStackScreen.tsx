import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, BackHandler, Modal} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import HomeSVG from 'components/svg/HomeSVG';
import ActivitySVG from 'components/svg/ActivitySVG';
import SwapSVG from 'components/svg/SwapSVG';
import MoreSVG from 'components/svg/MoreSVG';
import {createStackNavigator} from '@react-navigation/stack';
import SendReceiveBottomSheet from 'screens/portfolio/SendReceiveBottomSheet';
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet';
import SwapView from 'screens/swap/SwapView';
import AppNavigation from 'navigation/AppNavigation';
import PortfolioStackScreen from 'navigation/PortfolioStackScreen';
import SearchView from 'screens/search/SearchView';
import {
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import Loader from 'components/Loader';
import Activity from 'screens/activity/ActivityView';
import WatchlistSVG from 'components/svg/WatchlistSVG';
import {createDrawerNavigator} from '@react-navigation/drawer';
import DrawerView from 'screens/drawer/DrawerView';
import AddCustomToken from 'screens/search/AddCustomToken';
import CurrencySelector from 'screens/drawer/currency-selector/CurrencySelector';
import {SelectedTokenContextProvider} from 'contexts/SelectedTokenContext';
import SecurityPrivacyStackScreen from 'navigation/SecurityPrivacyStackScreen';
import WebViewScreen from 'screens/webview/WebViewScreen';
import ActivityDetailBottomSheet from 'screens/activity/ActivityDetailBottomSheet';
import {SelectedAccountContextProvider} from 'contexts/SelectedAccountContext';
import WatchlistView from 'screens/watchlist/WatchlistView';
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricsSDK from 'utils/BiometricsSDK';
import moment from 'moment';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import ReceiveOnlyBottomSheet from 'screens/portfolio/receive/ReceiveOnlyBottomSheet';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

export type DrawerStackParamList = {
  Tabs: undefined;
  CurrencySelector:
    | undefined
    | {onCurrencySelected: (code: string) => void; selectedCurrency: string};
  Legal: undefined;
  Security: undefined;
};

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const DrawerStack = createDrawerNavigator<DrawerStackParamList>();

const focusEvent = 'change';
const TIMEOUT = 5000;

function WalletStackScreen(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const walletContext = useWalletContext();
  const walletStateContext = useWalletStateContext();
  const [walletReady, setWalletReady] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const appState = useRef(AppState.currentState);

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
    const suspended =
      (await AsyncStorage.getItem('TIME_APP_SUSPENDED')) ??
      moment().toISOString();

    if (appState.current === 'active' && nextAppState.match(/background/)) {
      // this condition calls when app is in background mode
      // here you can detect application is going to background or inactive.
      await AsyncStorage.setItem('TIME_APP_SUSPENDED', moment().toISOString());
    } else if (
      appState.current.match(/background/) &&
      nextAppState === 'active' &&
      value &&
      moment().diff(moment(suspended)) >= TIMEOUT
    ) {
      // this condition calls when app is in foreground mode
      // here you can detect application is in active state again.
      setShowSecurityModal(true);
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

  const hdReadyListener = useCallback(
    (isBalanceReady: boolean) => setWalletReady(isBalanceReady),
    [],
  );

  useEffect(() => {
    const wallet = walletContext?.wallet as MnemonicWallet;
    const isBalanceReady = !!walletStateContext?.balances;
    if (wallet?.isHdReady) {
      hdReadyListener(isBalanceReady);
    } else {
      wallet?.on('hd_ready', () => hdReadyListener(isBalanceReady));
    }

    return () => {
      try {
        wallet?.off('hd_ready', () => hdReadyListener(isBalanceReady));
      } catch (e) {
        //ignored
      }
    };
  }, [walletContext, walletStateContext]);

  const onExit = (): void => {
    props.onExit();
  };

  const onSwitchWallet = (): void => {
    props.onSwitchWallet();
  };

  const DrawerScreen = () => (
    <DrawerStack.Navigator
      screenOptions={{headerShown: false}}
      useLegacyImplementation
      drawerContent={props => <DrawerView {...props} />}>
      <DrawerStack.Screen
        name={AppNavigation.Tabs.Tabs}
        options={{headerShown: false}}
        component={Tabs}
      />
    </DrawerStack.Navigator>
  );

  const PortfolioStackScreenWithProps = () => {
    return (
      <PortfolioStackScreen onExit={onExit} onSwitchWallet={onSwitchWallet} />
    );
  };

  const Tabs = () => {
    const theme = context.theme;
    return (
      <Tab.Navigator
        sceneContainerStyle={{backgroundColor: theme.colorBg1}}
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({focused}) => {
            switch (route.name) {
              case AppNavigation.Tabs.Portfolio:
                return <HomeSVG selected={focused} />;
              case AppNavigation.Tabs.Activity:
                return <ActivitySVG selected={focused} />;
              case AppNavigation.Tabs.Swap:
                return <SwapSVG selected={focused} />;
              case AppNavigation.Tabs.More:
                return <MoreSVG selected={focused} />;
              case AppNavigation.Tabs.Watchlist:
                return <WatchlistSVG selected={focused} />;
            }
          },
          tabBarAllowFontScaling: false,
          tabBarActiveTintColor: theme.accentColor,
          tabBarInactiveTintColor: theme.onBgSearch,
          tabBarStyle: {
            backgroundColor: theme.background,
          },
        })}>
        <Tab.Screen
          name={AppNavigation.Tabs.Portfolio}
          component={PortfolioStackScreenWithProps}
        />
        <Tab.Screen
          name={AppNavigation.Tabs.Watchlist}
          component={WatchlistView}
        />
        <Tab.Screen name={AppNavigation.Tabs.Activity} component={Activity} />
        <Tab.Screen name={AppNavigation.Tabs.Swap} component={SwapView} />
      </Tab.Navigator>
    );
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

  return !walletReady ? (
    <Loader message="Loading wallet. One moment please." />
  ) : (
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
              <RootStack.Screen name={'Drawer'} component={DrawerScreen} />
              <RootStack.Screen
                options={{
                  headerShown: true,
                  title: 'Manage token list',
                  headerBackTitleVisible: false,
                  headerStyle: {
                    backgroundColor: context.theme.background,
                  },
                }}
                name={AppNavigation.Wallet.SearchScreen}
                component={SearchView}
              />
              <RootStack.Screen
                options={{
                  headerShown: true,
                  title: 'Add custom token',
                  headerBackTitleVisible: false,
                  headerStyle: {
                    backgroundColor: context.theme.background,
                  },
                }}
                name={AppNavigation.Wallet.AddCustomToken}
                component={AddCustomToken}
              />
              <RootStack.Screen
                options={{
                  headerShown: true,
                  title: 'Currency',
                  headerBackTitleVisible: false,
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
                  headerShown: true,
                  title: 'Legal',
                  headerBackTitleVisible: false,
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
              // ignored
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
