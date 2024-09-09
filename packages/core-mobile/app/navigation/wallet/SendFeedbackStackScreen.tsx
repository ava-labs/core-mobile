import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import SendFeedback from 'screens/drawer/sendFeedback/SendFeedback'
import { SafeLowerAreaView } from 'components/SafeAreaViews'

export type SendFeedbackStackParamList = {
  [AppNavigation.SendFeedback.SendFeedback]: undefined
}

const SendFeedbackStack = createStackNavigator<SendFeedbackStackParamList>()

const SendFeedbackStackScreen = () => {
  return (
    <SafeLowerAreaView>
      <SendFeedbackStack.Navigator
        screenOptions={{
          headerBackTitleVisible: false
        }}>
        <SendFeedbackStack.Screen
          options={MainHeaderOptions({
            title: 'Send Feedback',
            headerBackTestID: 'header_back'
          })}
          name={AppNavigation.SendFeedback.SendFeedback}
          component={SendFeedback}
        />
      </SendFeedbackStack.Navigator>
    </SafeLowerAreaView>
  )
}

export default SendFeedbackStackScreen
