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
      {/* Warm Skia's font/glyph atlas while the user is in the trade tab so
          the LeverageGauge in the market detail modal paints without a
          first-mount blank frame. Mounted here (not at the app root) so apps
          that never enter trade don't pay the warmup cost. */}
      <SkiaPreload />
      <Stack screenOptions={stackNavigatorScreenOptions}>
        <Stack.Screen name="index" options={homeScreenOptions} />
      </Stack>
    </>
  )
}
