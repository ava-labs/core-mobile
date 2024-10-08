import { createStackNavigator } from '@react-navigation/stack'
import ContactsScreen from 'contacts/screens/ContactsScreen'
import React from 'react'

const Stack = createStackNavigator()

const ContactsStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ContactsScreen"
        options={{ title: 'Contacts' }}
        component={ContactsScreen}
      />
    </Stack.Navigator>
  )
}

export default ContactsStack
