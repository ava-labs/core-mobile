import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { noop } from '@avalabs/utils-sdk'
import { Modal, View } from 'react-native'
import AvaText from 'components/AvaText'
import { AreYouSureModal } from 'screens/browser/AreYouSureModal'
import IntroScreen from 'screens/browser/IntroScreen'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export type BrowserStackParamList = {
  [AppNavigation.Browser.Intro]: undefined
  [AppNavigation.Browser.TabView]: undefined
  [AppNavigation.Browser.TabsList]: undefined
  [AppNavigation.Browser.History]: undefined
  [AppNavigation.Browser.AreYouSure]: undefined
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
        component={TabView}
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
        name={AppNavigation.Browser.AreYouSure}
        options={{ presentation: 'modal' }}
        component={AreYouSureModal}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.Intro}
        options={{
          presentation: 'transparentModal',
          headerShown: false
        }}
        component={BrowserIntroScreen}
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

function BrowserIntroScreen(): JSX.Element {
  return (
    <View>
      <IntroScreen />
    </View>
  )
}

function TabView(): JSX.Element {
  const hasBeenViewedBrowser = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.BROWSER_INTERACTION)
  )
  const { navigate } =
    useNavigation<
      BrowserScreenProps<typeof AppNavigation.Browser.Intro>['navigation']
    >()

  if (!hasBeenViewedBrowser) {
    navigate(AppNavigation.Browser.Intro)
  }
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
