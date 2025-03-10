import { NavigatorScreenParams } from '@react-navigation/native'
import DrawerView from 'screens/drawer/DrawerView'
import AppNavigation from 'navigation/AppNavigation'
import TabNavigatorWithFab, {
  TabNavigatorParamList
} from 'navigation/wallet/TabNavigator'
import React, { FC, memo } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import DebugStack from 'debug/navigation/DebugStack'
import { useNavigation } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { isDebugOrInternalBuild } from 'utils/Utils'

export type DrawerParamList = {
  [AppNavigation.Wallet.Tabs]: NavigatorScreenParams<TabNavigatorParamList>
}

const DrawerStack = createDrawerNavigator()

const DrawerContent = (): JSX.Element => <DrawerView />

const BackButton = memo(() => {
  const navigation = useNavigation()

  return (
    <AvaButton.Icon
      onPress={() => navigation.goBack()}
      style={{ marginLeft: 16 }}>
      <CarrotSVG direction="left" size={24} />
    </AvaButton.Icon>
  )
})

const DrawerScreenStack: FC = () => {
  return (
    <DrawerStack.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: '80%' }
      }}
      drawerContent={DrawerContent}>
      <DrawerStack.Screen
        name={AppNavigation.Wallet.Tabs}
        component={TabNavigatorWithFab}
      />
      {isDebugOrInternalBuild() && (
        <DrawerStack.Screen
          name={AppNavigation.Debug.Menu}
          component={DebugStack}
          options={{
            title: '',
            headerShown: true,
            // eslint-disable-next-line react/no-unstable-nested-components
            headerLeft: () => <BackButton />
          }}
        />
      )}
    </DrawerStack.Navigator>
  )
}

export default React.memo(DrawerScreenStack)
