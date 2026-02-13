import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  ledgerModalScreensOptions
} from 'common/consts/screenOptions'

export default function LedgerReviewTransactionLayout(): JSX.Element {
  return (
    <Stack screenOptions={ledgerModalScreensOptions}>
      <Stack.Screen
        name="index"
        options={{
          ...modalFirstScreenOptions,
          freezeOnBlur: false // Explicitly disable freezeOnBlur on iOS for this screen
        }}
      />
    </Stack>
  )
}
