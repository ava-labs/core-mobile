import { Link } from 'expo-router'
import { View } from 'react-native'
import React from 'react'

export default function Index(): JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/signedIn/portfolio/">Sign In</Link>
      <Link href="/signedOut/">Signed Out</Link>
    </View>
  )
}
