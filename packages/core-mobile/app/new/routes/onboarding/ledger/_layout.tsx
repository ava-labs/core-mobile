import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { Stack } from 'common/components/Stack'
import React from 'react'

export default function LedgerOnboardingLayout(): JSX.Element {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="connectWallet" />
    </Stack>
  )
}