import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import StakeScreen from 'stake/screens/StakeScreen'

const Stack = createStackNavigator()

const StakeStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StakeScreen"
        options={{ title: 'Stake' }}
        component={StakeScreen}
      />
    </Stack.Navigator>
  )
}

export default StakeStack
