import AppNavigation from 'navigation/AppNavigation'
import {
  BottomTabHeaderProps,
  createBottomTabNavigator
} from '@react-navigation/bottom-tabs'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { usePosthogContext } from 'contexts/PosthogContext'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'
import WalletSVG from 'components/svg/WalletSVG'
import MenuSVG from 'components/svg/MenuSVG'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import { NoWalletDrawerScreenProps } from 'navigation/types'
import WatchlistTabView from 'screens/watchlist/WatchlistTabView'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'

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

const NoWalletTabNavigator = () => {
  const theme = useApplicationContext().theme
  const { capture } = usePosthogContext()
  const navigation = useNavigation<NavigationProp>()
  const walletState = useSelector(selectWalletState)

  /**
   * extracts creation of "normal" tab items
   * @param routeName
   * @param focused
   * @param image
   */
  function normalTabButtons(
    routeName: string,
    focused: boolean,
    image: React.ReactNode
  ) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', top: 2 }}>
        {image}
        <AvaText.Caption
          textStyle={{
            color: focused ? theme.alternateBackground : theme.colorIcon4
          }}>
          {routeName}
        </AvaText.Caption>
      </View>
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
        tabBarShowLabel: false,
        headerShown: true,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: theme.colorPrimary1,
        tabBarInactiveTintColor: theme.colorText2,
        tabBarStyle: {
          backgroundColor: theme.background
        },
        header: props => header(props, navigation)
      })}>
      {walletState !== WalletState.NONEXISTENT ? (
        <Tab.Screen
          name={AppNavigation.NoWalletTabs.EnterWallet}
          component={WatchlistTabView}
          options={{
            tabBarStyle: { justifyContent: 'center', alignItems: 'center' },
            tabBarButton: EnterWalletButton
          }}
        />
      ) : (
        <>
          <Tab.Screen
            name={AppNavigation.NoWalletTabs.NewWallet}
            component={WatchlistTabView}
            options={{
              tabBarIcon: ({ focused }) =>
                normalTabButtons(
                  AppNavigation.NoWalletTabs.NewWallet,
                  focused,
                  <CreateNewWalletPlusSVG size={TAB_ICON_SIZE} bold />
                )
            }}
            listeners={() => ({
              tabPress: e => {
                e.preventDefault()
                capture('NewWalletTabClicked')
                navigation.navigate(AppNavigation.NoWallet.CreateWalletStack)
              }
            })}
          />
          <Tab.Screen
            name={AppNavigation.NoWalletTabs.ExistingWallet}
            component={DummyComponent}
            options={{
              tabBarIcon: () =>
                normalTabButtons(
                  AppNavigation.NoWalletTabs.ExistingWallet,
                  true,
                  <WalletSVG size={TAB_ICON_SIZE} />
                )
            }}
            listeners={() => ({
              tabPress: e => {
                e.preventDefault()
                capture('ExistingWalletTabClicked')
                navigation.navigate(
                  AppNavigation.NoWallet.EnterWithMnemonicStack
                )
              }
            })}
          />
        </>
      )}
    </Tab.Navigator>
  )
}

const EnterWalletButton = () => {
  const appNavHook = useApplicationContext().appNavHook
  return (
    <AvaButton.PrimaryLarge
      style={{ flex: 1, marginHorizontal: 16 }}
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
