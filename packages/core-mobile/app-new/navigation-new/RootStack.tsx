import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import React from 'react'
import SignedOutStack from './signedOut/SignedOutStack'
import SignedInStack from './signedIn/SignedInStack'

const Stack = createStackNavigator<RootStackParamList>()

const RootStack = (): JSX.Element => {
  const isLoggedIn = true

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.ModalFadeTransition
      }}>
      {isLoggedIn ? (
        <Stack.Screen name="SignedInStack" component={SignedInStack} />
      ) : (
        <Stack.Screen name="SignedOutStack" component={SignedOutStack} />
      )}
      {/* <Stack.Group screenOptions={modalScreensOptions}> */}
      {/* Modal stacks for both signed in and out user */}
      {/* </Stack.Group> */}
    </Stack.Navigator>
  )
}

export type RootStackParamList = {
  SignedInStack: undefined
  SignedOutStack: undefined
}

export default RootStack
