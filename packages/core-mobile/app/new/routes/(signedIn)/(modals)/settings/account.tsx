import { Link } from 'expo-router'
import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'

const AccountScreen = (): JSX.Element => {
  return (
    <View
      sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Account Settings
      </Text>
      <Link href="">Delete Wallet</Link>
    </View>
  )
}

export default AccountScreen
