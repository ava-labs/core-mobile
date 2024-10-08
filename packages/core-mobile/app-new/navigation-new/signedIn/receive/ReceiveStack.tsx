import { createStackNavigator } from '@react-navigation/stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'navigation-new/utils/screenOptions'
import React from 'react'
import ReceiveScreen from 'receive/screens/ReceiveScreen'

const Stack = createStackNavigator<ReceiveStackParamList>()

const ReceiveStack = (): JSX.Element => {
  return (
    <Stack.Navigator screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="ReceiveScreen"
        options={modalFirstScreenOptions}
        component={ReceiveScreen}
      />
    </Stack.Navigator>
  )
}

export type ReceiveStackParamList = {
  ReceiveScreen: undefined
}

export default ReceiveStack
