import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'resources/Constants'
import { useAnalytics } from 'hooks/useAnalytics'

export type LegalStackParamList = {
  [AppNavigation.Legal.Legal]: undefined
}

const LegalStack = createStackNavigator<LegalStackParamList>()

function LegalStackScreen(): JSX.Element {
  return (
    <LegalStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false
      }}>
      <LegalStack.Screen
        options={MainHeaderOptions({ title: 'Legal' })}
        name={AppNavigation.Legal.Legal}
        component={LegalScreen}
      />
    </LegalStack.Navigator>
  )
}

const LegalScreen = (): JSX.Element => {
  const { openUrl } = useInAppBrowser()
  const { capture } = useAnalytics()

  return (
    <View>
      <AvaListItem.Base
        title={'Terms of Use'}
        onPress={() => {
          capture('TermsOfUseClicked')
          openUrl(TERMS_OF_USE_URL)
        }}
      />
      <AvaListItem.Base
        title={'Privacy Policy'}
        onPress={() => {
          capture('PrivacyPolicyClicked')
          openUrl(PRIVACY_POLICY_URL)
        }}
      />
    </View>
  )
}

export default LegalStackScreen
