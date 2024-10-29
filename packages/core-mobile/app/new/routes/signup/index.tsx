import { Link } from 'expo-router'
import { View } from 'react-native'
import React from 'react'
import { Button } from '@avalabs/k2-alpine'

const SignUpScreen = (): JSX.Element => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/portfolio/" asChild>
        <Button type="primary" size="medium">
          Sign up
        </Button>
      </Link>
    </View>
  )
}

export default SignUpScreen
