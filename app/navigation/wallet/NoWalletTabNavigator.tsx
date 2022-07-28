import AppNavigation from 'navigation/AppNavigation'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
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
import { DrawerScreenProps } from 'navigation/types'
import WatchlistTabView from 'screens/watchlist/WatchlistTabView'

const DummyComponent = () => (
  <View style={{ flex: 1, backgroundColor: 'transparent' }} />
)

export type TabNavigatorParamList = {
  [AppNavigation.Tabs.NewWallet]: undefined
  [AppNavigation.Tabs.ExistingWallet]: undefined
}

type NavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']
const Tab = createBottomTabNavigator<TabNavigatorParamList>()
const TAB_ICON_SIZE = 28

const NoWalletTabNavigator = () => {
  const theme = useApplicationContext().theme
  const { capture } = usePosthogContext()
  const navigation = useNavigation<NavigationProp>()

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
        header: () => (
          <AvaButton.Icon
            onPress={navigation.openDrawer}
            style={{ padding: 16 }}>
            <MenuSVG />
          </AvaButton.Icon>
        )
      })}>
      <Tab.Screen
        name={AppNavigation.Tabs.NewWallet}
        component={WatchlistTabView}
        options={{
          tabBarIcon: ({ focused }) =>
            normalTabButtons(
              AppNavigation.Tabs.NewWallet,
              focused,
              <CreateNewWalletPlusSVG size={TAB_ICON_SIZE} bold />
            )
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault()
            navigation.navigate(AppNavigation.Onboard.CreateWalletStack)
          }
        })}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.ExistingWallet}
        component={DummyComponent}
        options={{
          tabBarIcon: () =>
            normalTabButtons(
              AppNavigation.Tabs.ExistingWallet,
              true,
              <WalletSVG size={TAB_ICON_SIZE} />
            )
        }}
        listeners={() => ({
          tabPress: e => {
            e.preventDefault()
            navigation.navigate(AppNavigation.Onboard.EnterWithMnemonicStack)
          }
        })}
      />
    </Tab.Navigator>
  )
}

export default React.memo(NoWalletTabNavigator)
