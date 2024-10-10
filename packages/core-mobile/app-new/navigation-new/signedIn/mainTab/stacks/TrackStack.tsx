import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import TrackHomeScreen from 'track/screens/TrackHomeScreen'

const Stack = createStackNavigator()

const TrackStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TrackHomeScreen" component={TrackHomeScreen} />
    </Stack.Navigator>
  )
}

export default TrackStack
