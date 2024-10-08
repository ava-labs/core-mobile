import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import StakeHomeScreen from 'stake/screens/StakeHomeScreen'

const Stack = createStackNavigator()

const StakeStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StakeHomeScreen" component={StakeHomeScreen} />
    </Stack.Navigator>
  )
}

export default StakeStack
