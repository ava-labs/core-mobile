import React from 'react'
import { Text, View } from 'react-native'
import { Link } from 'expo-router'

const SettingsScreen = (): JSX.Element => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/settings/account">
        <Text>Go to Account Setting</Text>
      </Link>
    </View>
  )
}

export default SettingsScreen
