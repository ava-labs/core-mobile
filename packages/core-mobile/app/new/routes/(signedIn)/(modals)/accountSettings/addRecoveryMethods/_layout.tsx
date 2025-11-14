import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { RecoverMethodsProvider } from 'features/accountSettings/context/RecoverMethodsProvider'
import { useDisableLockAppStore } from 'features/accountSettings/store'
import React, { useEffect } from 'react'

export default function AddRecoveryMethodsLayout(): JSX.Element {
  useEffect(() => {
    useDisableLockAppStore.setState({ disableLockApp: true })

    return () => {
      useDisableLockAppStore.setState({ disableLockApp: false })
    }
  }, [])

  return (
    <RecoverMethodsProvider>
      <Stack
        screenOptions={{
          ...stackNavigatorScreenOptions,
          headerShown: false
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="available" />
        <Stack.Screen name="(fido)" />
        <Stack.Screen name="(totp)" />
        <Stack.Screen name="verifyMfa" />
      </Stack>
    </RecoverMethodsProvider>
  )
}
