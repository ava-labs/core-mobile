import { createStackNavigator } from '@react-navigation/stack'
import ContactsHomeScreen from 'contacts/screens/ContactsHomeScreen'
import React from 'react'

const Stack = createStackNavigator()

const ContactsStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ContactsHomeScreen" component={ContactsHomeScreen} />
    </Stack.Navigator>
  )
}

export default ContactsStack
