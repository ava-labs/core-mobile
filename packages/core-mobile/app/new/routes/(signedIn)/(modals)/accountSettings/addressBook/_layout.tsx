import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import React from 'react'

export default function AddressBookLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        ...stackNavigatorScreenOptions,
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
