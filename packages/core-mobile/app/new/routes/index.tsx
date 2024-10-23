import { Link } from 'expo-router'
import { View } from 'react-native'
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
      <Link href="/portfolio/">Sign in</Link>
      <Link href="/signup/">Sign up</Link>
    </View>
  )
}
