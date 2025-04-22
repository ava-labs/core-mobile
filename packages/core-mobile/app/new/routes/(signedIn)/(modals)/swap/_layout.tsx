import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { AVAX_TOKEN_ID, USDC_TOKEN_ID } from 'features/swap/const'
import { SwapContextProvider } from 'features/swap/contexts/SwapContext'

export default function SwapLayout(): JSX.Element {
  return (
    <SwapContextProvider>
      <Stack screenOptions={modalStackNavigatorScreenOptions}>
        <Stack.Screen
          name="index"
          options={modalFirstScreenOptions}
          initialParams={{
            initialTokenIdFrom: AVAX_TOKEN_ID,
            initialTokenIdTo: USDC_TOKEN_ID
          }}
        />
      </Stack>
    </SwapContextProvider>
  )
}
