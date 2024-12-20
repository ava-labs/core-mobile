import React from 'react'
import { Button, Text, View } from '@avalabs/k2-alpine'
import { Link } from 'expo-router'

const SettingsScreen = (): JSX.Element => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3">Settings</Text>
      <Link href="/settings/account" asChild>
        <Button type="secondary" size="medium">
          Go to Account Setting
        </Button>
      </Link>
    </View>
  )
}

export default SettingsScreen
