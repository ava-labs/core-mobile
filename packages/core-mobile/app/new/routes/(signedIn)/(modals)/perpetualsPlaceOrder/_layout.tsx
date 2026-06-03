import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import { PlaceOrderProvider } from 'features/trade/perpetuals/contexts/PlaceOrderContext'
import { useSeededPlaceOrderProps } from 'features/trade/perpetuals/hooks/useSeededPlaceOrderProps'
import React from 'react'

export default function PerpetualsPlaceOrderLayout(): JSX.Element {
  const props = useSeededPlaceOrderProps()

  return (
    <PlaceOrderProvider {...props}>
      <Stack screenOptions={stackScreensOptions}>
        <Stack.Screen name="index" options={modalFirstScreenOptions} />
        <Stack.Screen name="leverage" options={stackScreensOptions} />
        <Stack.Screen name="trigger" options={stackScreensOptions} />
      </Stack>
    </PlaceOrderProvider>
  )
}
