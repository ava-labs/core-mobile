import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import TrackScreen from 'track/screens/TrackScreen'

const Stack = createStackNavigator()

const TrackStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TrackScreen"
        options={{ title: 'Track' }}
        component={TrackScreen}
      />
    </Stack.Navigator>
  )
}

export default TrackStack
