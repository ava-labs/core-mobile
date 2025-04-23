import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { SendContextProvider } from 'features/send/context/sendContext'

export default function NftSendLayout(): JSX.Element {
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
      </Stack>
    </SendContextProvider>
  )
}
