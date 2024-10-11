// import useHomeScreenHeader from 'navigation-new/hooks/useHomeScreenHeader'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Link } from 'expo-router'

const SettingsScreen = (): JSX.Element => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/signedIn/settings/account">
        <Text>Go to Account Setting</Text>
      </Link>
    </View>
  )
}

export default SettingsScreen
