import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { SendContextProvider } from 'features/send/context/sendContext'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
export default function SendLayout(): JSX.Element {
  const hasBeenViewedOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SEND_ONBOARDING)
  )

  const initialRouteName = hasBeenViewedOnboarding
    ? 'recentContacts'
    : 'onboarding'

  return (
    <SendContextProvider>
      <Stack
        initialRouteName={initialRouteName}
        screenOptions={modalStackNavigatorScreenOptions}>
        <Stack.Screen name="onboarding" options={modalFirstScreenOptions} />
        <Stack.Screen
          name="recentContacts"
          options={
            hasBeenViewedOnboarding ? modalFirstScreenOptions : undefined
          }
        />
        <Stack.Screen name="scanQrCode" />
        <Stack.Screen name="send" />
      </Stack>
    </SendContextProvider>
  )
}
