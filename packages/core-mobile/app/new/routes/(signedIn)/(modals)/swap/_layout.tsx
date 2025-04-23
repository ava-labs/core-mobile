import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { SwapContextProvider } from 'features/swap/contexts/SwapContext'

export default function SwapLayout(): JSX.Element {
  return (
    <SwapContextProvider>
      <Stack screenOptions={modalStackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={modalFirstScreenOptions} />
      </Stack>
    </SwapContextProvider>
  )
}
