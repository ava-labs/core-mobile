import React, { useEffect } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import { noop } from '@avalabs/core-utils-sdk'
import TabViewScreen from 'screens/browser/TabViewScreen'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { HistoryScreen } from 'screens/browser/HistoryScreen'
import { SubHeaderOptions } from 'navigation/NavUtils'
import IntroModal from 'screens/onboarding/IntroModal'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import CoreLogo from 'assets/icons/core.svg'
import RocketLaunch from 'assets/icons/rocket_launch.svg'
import SearchIcon from 'assets/icons/search.svg'
import { useTheme } from '@avalabs/k2-mobile'
import { ClearAllHistoryModal } from 'screens/browser/ClearAllHistoryModal'
import AnalyticsService from 'services/analytics/AnalyticsService'

export type BrowserStackParamList = {
  [AppNavigation.Browser.Intro]: undefined
  [AppNavigation.Browser.TabView]: undefined
  [AppNavigation.Browser.History]: undefined
  [AppNavigation.Browser.ClearAllHistory]: undefined
}

const BrowserStack = createStackNavigator<BrowserStackParamList>()

function BrowserScreenStack(): JSX.Element {
  return (
    <BrowserStack.Navigator>
      <BrowserStack.Screen
        name={AppNavigation.Browser.TabView}
        options={{ header: () => renderNavigationHeader({}) }}
        component={TabView}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.History}
        options={{
          ...SubHeaderOptions('History')
        }}
        component={HistoryStub}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.ClearAllHistory}
        options={{ presentation: 'transparentModal', headerShown: false }}
        component={ClearAllHistoryModal}
      />
      <BrowserStack.Screen
        name={AppNavigation.Browser.Intro}
        options={{
          presentation: 'transparentModal',
          headerShown: false
        }}
        component={BrowserIntroModal}
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
    showAccountSelector={true}
    showNetworkSelector={false}
    showBackButton={showBackButton}
    onBack={onBack}
  />
)

export default React.memo(BrowserScreenStack)

const BrowserIntroModal = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const descriptions = [
    {
      icon: <SearchIcon />,
      text: 'Search for a website or browse suggested apps'
    },
    {
      icon: <WalletConnectSVG color={colors.$neutral50} />,
      text: 'On the website find “Connect” then tap Wallet Connect'
    },
    {
      icon: <CoreLogo width={24} height={24} />,
      text: 'Find Core and tap “Connect”'
    },
    {
      icon: <RocketLaunch />,
      text: 'Conquer the cryptoverse!'
    }
  ]
  return (
    <IntroModal
      heading="How to use the Core Browser..."
      viewOnceKey={ViewOnceKey.BROWSER_INTERACTION}
      buttonText="Get Started"
      descriptions={descriptions}
      onConfirm={() =>
        AnalyticsService.capture('BrowserWelcomeScreenButtonTapped')
      }
      testID="browser-intro-modal"
    />
  )
}

type TabViewScreenProps = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>

function TabView(): JSX.Element {
  const hasBeenViewedBrowser = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.BROWSER_INTERACTION)
  )
  const { navigate } = useNavigation<TabViewScreenProps['navigation']>()

  useEffect(() => {
    if (!hasBeenViewedBrowser) {
      navigate(AppNavigation.Browser.Intro)
    }
  }, [hasBeenViewedBrowser, navigate])

  return <TabViewScreen />
}

function HistoryStub(): JSX.Element {
  return <HistoryScreen />
}
