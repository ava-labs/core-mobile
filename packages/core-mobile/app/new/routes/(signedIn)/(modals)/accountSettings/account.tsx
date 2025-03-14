import { Link } from 'expo-router'
import React from 'react'
import { View, Text, Button } from '@avalabs/k2-alpine'

const AccountScreen = (): JSX.Element => {
  return (
    <View
      sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text variant="heading3">Account Settings</Text>
      <Link href="/" asChild>
        <Button size="medium" type="tertiary">
          Delete Wallet
        </Button>
      </Link>
    </View>
  )
}

export default AccountScreen
