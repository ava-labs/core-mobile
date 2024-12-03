import { Link, useRouter } from 'expo-router'
import { View, Button } from '@avalabs/k2-alpine'
import React from 'react'
import { showSnackbar } from 'new/utils/snackbar'

export default function Index(): JSX.Element {
  const { navigate } = useRouter()

  const handleSignIn = (): void => {
    navigate('/portfolio/')

    showSnackbar('Code copied')
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Button type="primary" size="medium" onPress={handleSignIn}>
        Sign in
      </Button>
      <Link href="/signup/" asChild>
        <Button type="primary" size="medium">
          Sign up
        </Button>
      </Link>
    </View>
  )
}
