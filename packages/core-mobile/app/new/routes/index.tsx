import { Link } from 'expo-router'
import { View, Text } from '@avalabs/k2-alpine'
import React from 'react'

export default function Index(): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Link href="/portfolio/">
        <Text>Sign in</Text>
      </Link>
      <Link href="/signup/">
        <Text>Sign up</Text>
      </Link>
    </View>
  )
}
