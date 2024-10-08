import { createStackNavigator } from '@react-navigation/stack'
import BrowserHomeScreen from 'browser/screens/BrowserHomeScreen'
import React from 'react'

const Stack = createStackNavigator()

const BrowserStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowserHomeScreen" component={BrowserHomeScreen} />
    </Stack.Navigator>
  )
}

export default BrowserStack
