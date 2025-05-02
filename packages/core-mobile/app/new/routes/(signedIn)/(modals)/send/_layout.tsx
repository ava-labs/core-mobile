import { Stack } from 'common/components/Stack'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { SendContextProvider } from 'features/send/context/sendContext'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
export default function SendLayout(): JSX.Element {
  const { modalStackNavigatorScreenOptions, modalFirstScreenOptions } =
    useModalScreenOptions()
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
