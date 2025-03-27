import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import SendFeedback from 'screens/drawer/sendFeedback/SendFeedback'

export type SendFeedbackStackParamList = {
  [AppNavigation.SendFeedback.SendFeedback]: undefined
}

const SendFeedbackStack = createStackNavigator<SendFeedbackStackParamList>()

const SendFeedbackStackScreen = (): JSX.Element => {
  return (
    <SendFeedbackStack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
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
  )
}

export default SendFeedbackStackScreen
