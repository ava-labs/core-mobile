import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import React from 'react'
import { Platform } from 'react-native'

export default function StakeSearchLayout(): JSX.Element {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="index"
        // The screen owns its own SearchBar + Cancel button.
        // iOS: keep an (empty, transparent) header so that when `stakeDetail`
        // is pushed on top there's a header to interpolate from (avoids the
        // mid-transition "clunk").
        // Android: HIDE the native header. A transparent native stack header
        // still sits over the top of the content there and swallows touches on
        // the SearchBar / Cancel (verified via the view hierarchy — the search
        // controls sit under the header band and never receive taps).
        options={{
          ...modalFirstScreenOptions,
          headerShown: Platform.OS === 'ios'
        }}
      />
      {/* Pushed on top of the search results when a stake is tapped, so the
          detail stays within the search modal stack instead of opening the
          global /stakeDetail modal. */}
      <Stack.Screen name="stakeDetail" options={stackScreensOptions} />
    </Stack>
  )
}
