import AppNavigation from 'navigation/AppNavigation'
import {
  BottomTabHeaderProps,
  createBottomTabNavigator
} from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import CreateNewWalletPlusSVG, {
  IconWeight
} from 'components/svg/CreateNewWalletPlusSVG'
import WalletSVG from 'components/svg/WalletSVG'
import MenuSVG from 'components/svg/MenuSVG'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import {
  NoWalletDrawerScreenProps,
  NoWalletScreenProps
} from 'navigation/types'
import WatchlistTabView from 'screens/watchlist/WatchlistTabView'
import { useSelector } from 'react-redux'
import { selectIsLocked, selectWalletState, WalletState } from 'store/app'
import {
  BOTTOM_BAR_HEIGHT,
  getCommonBottomTabOptions,
  normalTabButton
} from 'navigation/NavUtils'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { usePostCapture } from 'hooks/usePosthogCapture'

export type NoWalletTabNavigatorParamList = {
  [AppNavigation.NoWalletTabs.NewWallet]: undefined
  [AppNavigation.NoWalletTabs.ExistingWallet]: undefined
  [AppNavigation.NoWalletTabs.EnterWallet]: undefined
}

type NavigationProp = NoWalletDrawerScreenProps<
  typeof AppNavigation.NoWallet.Tabs
>['navigation']
const Tab = createBottomTabNavigator<NoWalletTabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const DummyComponent = () => (
  <View style={{ flex: 1, backgroundColor: 'transparent' }} />
)

function header(props: BottomTabHeaderProps, navigation: NavigationProp) {
  return (
    <AvaButton.Icon
      {...props}
      onPress={navigation.openDrawer}
      style={{ padding: 16 }}>
      <MenuSVG />
    </AvaButton.Icon>
  )
}

type DrawerNavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']
const NoWalletTabNavigator = () => {
  const theme = useApplicationContext().theme
  const { capture } = usePostCapture()
  const drawerNavigation = useNavigation<DrawerNavigationProp>()
  const tabsNavigation = useNavigation<NavigationProp>()
  const walletState = useSelector(selectWalletState)
  const { pendingDeepLink } = useDeeplink()
  const isLocked = useSelector(selectIsLocked)
  const appNavHook = useApplicationContext().appNavHook

  useEffect(() => {
    if (pendingDeepLink && walletState === WalletState.NONEXISTENT) {
      showSnackBarCustom({
        component: (
          <GeneralToast
            message={`No wallet found. Create or add a wallet to Core to connect to applications.`}
          />
        ),
        duration: 'short'
      })
    }

    if (
      pendingDeepLink &&
      isLocked &&
      walletState !== WalletState.NONEXISTENT
    ) {
      appNavHook?.navigation?.current?.navigate(
        AppNavigation.NoWallet.Welcome,
        { screen: AppNavigation.Onboard.Login }
      )
    }
  }, [appNavHook?.navigation, isLocked, pendingDeepLink, walletState])

  const renderNonExistentWalletTab = () => (
    <>
      <Tab.Screen
        name={AppNavigation.NoWalletTabs.NewWallet}
        component={WatchlistTabView}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButton({
              testID: 'no_wallet_tab_navigator__create_new_wallet_button',
              theme,
              routeName: AppNavigation.NoWalletTabs.NewWallet,
              focused,
              image: (
                <CreateNewWalletPlusSVG
                  size={TAB_ICON_SIZE}
                  weight={IconWeight.bold}
                />
              )
            })
        }}
        listeners={() => ({
          tabPress: e => {
            e.preventDefault()
            capture('NewWalletTabClicked')
            drawerNavigation.navigate(AppNavigation.NoWallet.Welcome, {
              screen: AppNavigation.Onboard.AnalyticsConsent,
              params: {
                nextScreen: AppNavigation.Onboard.CreateWalletStack
              }
            })
          }
        })}
      />
      <Tab.Screen
        name={AppNavigation.NoWalletTabs.ExistingWallet}
        component={DummyComponent}
        options={{
          tabBarIcon: () =>
            normalTabButton({
              testID: 'no_wallet_tab_navigator__recover_wallet_button',
              theme,
              routeName: AppNavigation.NoWalletTabs.ExistingWallet,
              focused: true,
              image: <WalletSVG size={TAB_ICON_SIZE} />
            })
        }}
        listeners={() => ({
          tabPress: e => {
            e.preventDefault()
            capture('ExistingWalletTabClicked')
            drawerNavigation.navigate(AppNavigation.NoWallet.Welcome, {
              screen: AppNavigation.Onboard.AnalyticsConsent,
              params: {
                nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
              }
            })
          }
        })}
      />
    </>
  )

  const renderExistentWalletTab = () => {
    return (
      <>
        <Tab.Screen
          name={AppNavigation.NoWalletTabs.EnterWallet}
          component={WatchlistTabView}
          options={{
            tabBarStyle: {
              height: BOTTOM_BAR_HEIGHT + 10 // add a bit more space since this is for a big button
            },
            tabBarButton: EnterWalletButton
          }}
        />
      </>
    )
  }
  /**
   * Due to the use of a custom FAB as a tab icon, spacing needed to be manually manipulated
   * which required the "normal" items to be manually rendered on `options.tabBarIcon` instead of automatically handled
   * by Tab.Navigator.
   */
  return (
    <Tab.Navigator
      screenOptions={() => ({
        ...getCommonBottomTabOptions(theme),
        header: props => header(props, tabsNavigation)
      })}>
      {walletState !== WalletState.NONEXISTENT
        ? renderExistentWalletTab()
        : renderNonExistentWalletTab()}
    </Tab.Navigator>
  )
}

const EnterWalletButton = () => {
  const appNavHook = useApplicationContext().appNavHook
  return (
    <AvaButton.PrimaryLarge
      style={{ flex: 1, marginHorizontal: 16, alignSelf: 'center' }}
      onPress={() => {
        appNavHook?.navigation?.current?.navigate(
          AppNavigation.NoWallet.Welcome,
          { screen: AppNavigation.Onboard.Login }
        )
      }}>
      Enter Wallet
    </AvaButton.PrimaryLarge>
  )
}

export default React.memo(NoWalletTabNavigator)
