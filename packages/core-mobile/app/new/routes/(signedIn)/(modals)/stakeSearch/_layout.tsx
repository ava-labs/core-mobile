import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function StakeSearchLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="index"
        // The screen owns its own SearchBar + Cancel button, so the header is
        // kept empty (no back button, no title) but NOT hidden. Keeping a
        // (transparent) header here means that when `stakeDetail` is pushed on
        // top, iOS has a header to interpolate from — without it the detail's
        // header pops in mid-transition (visible "clunk").
        options={modalFirstScreenOptions}
      />
      {/* Pushed on top of the search results when a stake is tapped, so the
          detail stays within the search modal stack instead of opening the
          global /stakeDetail modal. */}
      <Stack.Screen name="stakeDetail" options={stackScreensOptions} />
    </Stack>
  )
}
