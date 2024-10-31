import { Link } from 'expo-router'
import { View, Button } from '@avalabs/k2-alpine'
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
      <Link href="/portfolio/" asChild>
        <Button type="primary" size="medium">
          Sign in
        </Button>
      </Link>
      <Link href="/signup/" asChild>
        <Button type="primary" size="medium">
          Sign up
        </Button>
      </Link>
    </View>
  )
}
