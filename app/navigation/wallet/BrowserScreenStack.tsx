import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { noop } from '@avalabs/utils-sdk'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { AreYouSureModal } from 'screens/browser/AreYouSureModal'

export type BrowserStackParamList = {
  [AppNavigation.Browser.Intro]: undefined
  [AppNavigation.Browser.TabView]: undefined
  [AppNavigation.Browser.TabsList]: undefined
  [AppNavigation.Browser.History]: undefined
  [AppNavigation.Browser.AreYousSure]: undefined
}

const BrowserStack = createStackNavigator<BrowserStackParamList>()

function BrowserScreenStack(): JSX.Element {
  return (
    <BrowserStack.Navigator
      screenOptions={{
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerLeftContainerStyle: {
          paddingLeft: 8
        }
      }}>
      <BrowserStack.Screen
        name={AppNavigation.Browser.TabView}
        options={{ headerShown: false }}
        component={TabViewStub}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.TabsList}
        options={{ headerShown: false }}
        component={TabsListStub}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.History}
        options={{
          header: () => renderNavigationHeader({})
        }}
        component={HistoryStub}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.AreYousSure}
        options={{ presentation: 'transparentModal' }}
        component={AreYouSureModal}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.Intro}
        options={{ headerShown: false }}
        component={IntroStub}
      />
    </BrowserStack.Navigator>
  )
}

const renderNavigationHeader = ({
  showBackButton = false,
  onBack = noop
}: {
  showBackButton?: boolean
  onBack?: () => void
}): JSX.Element => (
  <TopNavigationHeader
    showAccountSelector={false}
    showNetworkSelector={false}
    showBackButton={showBackButton}
    onBack={onBack}
  />
)

export default React.memo(BrowserScreenStack)

function IntroStub(): JSX.Element {
  return (
    <View>
      <AvaText.LargeTitleBold>IntroStub</AvaText.LargeTitleBold>
    </View>
  )
}

function TabViewStub(): JSX.Element {
  return (
    <View>
      <AvaText.LargeTitleBold>TabViewStub</AvaText.LargeTitleBold>
    </View>
  )
}

function TabsListStub(): JSX.Element {
  return (
    <View>
      <AvaText.LargeTitleBold>TabsListStub</AvaText.LargeTitleBold>
    </View>
  )
}

function HistoryStub(): JSX.Element {
  return (
    <View>
      <AvaText.LargeTitleBold>HistoryStub</AvaText.LargeTitleBold>
    </View>
  )
}
