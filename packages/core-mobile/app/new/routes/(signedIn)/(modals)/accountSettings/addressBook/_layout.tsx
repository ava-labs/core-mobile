import { Stack } from 'common/components/Stack'
import React from 'react'

export default function AddressBookLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addContact" />
      <Stack.Screen name="contactDetail" />
      <Stack.Screen name="scanQrCode" />
      <Stack.Screen name="selectContactAvatar" />
    </Stack>
  )
}
