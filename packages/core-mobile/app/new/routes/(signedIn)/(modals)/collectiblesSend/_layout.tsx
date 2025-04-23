import React, { useState, useEffect } from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { PageControl } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'
import { useNavigation } from 'expo-router'

export default function NftSendLayout(): JSX.Element {
  const hasBeenViewedOnboarding = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SEND_ONBOARDING)
  )
  const [currentPage, setCurrentPage] = useState(0)
  const state = useNavigation().getState()

  useEffect(() => {
    const sendRoute = state?.routes?.find(
      route => route.name === '(modals)/collectiblesSend'
    )
    if (sendRoute?.state?.index !== undefined) {
      setCurrentPage(sendRoute.state.index)
    }
  }, [state])

  const renderPageControl = (): React.ReactNode => (
    <PageControl numberOfPage={1} currentPage={currentPage} />
  )

  const initialRouteName = hasBeenViewedOnboarding
    ? 'recentContacts'
    : 'onboarding'

  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={{
        ...modalStackNavigatorScreenOptions,
        headerTitle: renderPageControl
      }}>
      <Stack.Screen
        name="onboarding"
        options={{ ...modalFirstScreenOptions, headerTitle: undefined }}
      />
      <Stack.Screen name="recentContacts" options={modalFirstScreenOptions} />
      <Stack.Screen name="scanQrCode" options={{ headerTitle: undefined }} />
    </Stack>
  )
}
