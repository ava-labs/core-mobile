import { Stack } from 'common/components/Stack'
import { stackScreensOptions } from 'common/consts/screenOptions'
import React from 'react'
// CP-14918 TEMP PROBE
import { perfRenderProfile } from 'utils/performance/perfProbe'

export default function TokenDetailScreenLayout(): JSX.Element {
  return (
    // CP-14918 TEMP PROBE: this codebase has no shared "(modals) group
    // layout" — every modal route (including tokenDetail) is a flat
    // Stack.Screen on the single Stack in (signedIn)/_layout.tsx. This
    // per-route Stack (which Expo Router generates for any directory-based
    // route) is the closest structural equivalent, and sits directly between
    // 'signedInStack' and the TokenDetailScreen component's own 'tokenDetail'
    // Profiler (NonXpTokenDetailScreen.tsx). Diffing signedInStack against
    // this id isolates how much of the outer commit is the rest of the
    // navigator tree (tabs + ~80 other modal screens) vs. this route.
    <React.Profiler id="tokenDetailRouteStack" onRender={perfRenderProfile}>
      <Stack screenOptions={stackScreensOptions}>
        <Stack.Screen name="index" />
      </Stack>
    </React.Profiler>
  )
}
