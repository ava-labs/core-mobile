import { Link } from 'expo-router'
import React from 'react'
import { View } from '@avalabs/k2-alpine'

const AccountScreen = (): JSX.Element => {
  return (
    <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="">Sign out</Link>
    </View>
  )
}

export default AccountScreen
