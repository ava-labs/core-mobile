import { useRouter } from 'expo-router'
import { View, Button } from '@avalabs/k2-alpine'
import React from 'react'
import { showToast } from 'new/utils/toast'

export default function Index(): JSX.Element {
  const { navigate } = useRouter()

  const handleSignIn = (): void => {
    navigate('/portfolio/')

    showToast({
      toastType: 'snackbar',
      content: {
        message: 'Welcome back!'
      }
    })
  }

  const handleSignUp = (): void => {
    // navigate('/signup/')

    showToast({
      toastType: 'notificationAlert',
      content: {
        type: 'success',
        title: 'Sign up',
        message: 'Sign up button pressed'
      }
    })
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
      <Button type="primary" size="medium" onPress={handleSignUp}>
        Sign up
      </Button>
    </View>
  )
}
