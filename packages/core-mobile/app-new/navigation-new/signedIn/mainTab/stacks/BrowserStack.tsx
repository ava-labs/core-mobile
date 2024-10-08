import { createStackNavigator } from '@react-navigation/stack'
import BrowserScreen from 'browser/screens/BrowserScreen'
import React from 'react'

const Stack = createStackNavigator()

const BrowserStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BrowserScreen"
        options={{ title: 'Browser' }}
        component={BrowserScreen}
      />
    </Stack.Navigator>
  )
}

export default BrowserStack
