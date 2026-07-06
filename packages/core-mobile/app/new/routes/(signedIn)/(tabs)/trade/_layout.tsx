import { SkiaPreload } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function TradeLayout(): JSX.Element {
  return (
    <>
      <Stack screenOptions={stackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={homeScreenOptions} />
      </Stack>
      <SkiaPreload />
    </>
  )
}
