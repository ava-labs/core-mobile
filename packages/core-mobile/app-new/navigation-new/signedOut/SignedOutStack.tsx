import { createStackNavigator } from '@react-navigation/stack'
import SignUpScreen from 'onboarding/screens/SignUpScreen'
import React from 'react'

const Stack = createStackNavigator()

const SignedOutStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      {/* <Stack.Group screenOptions={modalScreensOptions}> */}
      {/* Modal stacks for signed out user */}
      {/* </Stack.Group> */}
    </Stack.Navigator>
  )
}

export default SignedOutStack
