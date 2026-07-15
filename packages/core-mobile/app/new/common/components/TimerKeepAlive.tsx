import React, { useState } from 'react'
import { View } from 'react-native'
import { useFrameCallback, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

// ~4 commits/sec at 120fps — enough to keep due timers firing promptly.
const PULSE_EVERY_N_FRAMES = 30

/**
 * Workaround for a release-only iOS stall (observed on RN 0.85 / iOS 26) —
 * remove once fixed upstream in React Native.
 *
 * Once the app goes idle with only far-away timers pending, the JS-timer
 * pipeline parks: `setTimeout` callbacks stop firing until an external event
 * (e.g. a touch) arrives. Timer-driven waits then freeze — the stake
 * submission's cross-chain UTXO polling/backoff (`EarnService`), the success
 * screen's auto-dismiss, toast timeouts. Debug builds mask the bug because
 * the Metro socket keeps feeding the event loop.
 *
 * Mount this (invisible, 1×1) while such a wait is in flight. A Reanimated
 * frame callback on the UI thread — which keeps running while the JS-timer
 * pipeline is parked — periodically schedules a state bump on the JS thread,
 * and the resulting Fabric commit keeps the timer pipeline alive. On-device
 * A/B showed BOTH halves are essential:
 * - The tick source must live on the UI thread: `setTimeout`/`rAF`-driven
 *   tickers park along with everything else, even when they commit.
 * - The tick must produce a real commit: bare `scheduleOnRN` pulses (no
 *   state/commit) don't unstick the timers.
 *
 * Costs a UI-thread frame callback plus ~4 tiny commits/sec while mounted —
 * scope it to timer-dependent waits (e.g. transaction processing), not whole
 * screens.
 */
export const TimerKeepAlive = (): JSX.Element => {
  const [tick, setTick] = useState(0)

  const frameCount = useSharedValue(0)
  const bump = (): void => setTick(t => (t + 1) % 2)
  useFrameCallback(() => {
    'worklet'
    frameCount.value = (frameCount.value + 1) % PULSE_EVERY_N_FRAMES
    if (frameCount.value === 0) {
      scheduleOnRN(bump)
    }
  }, true)

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        // Alternate a harmless style value each tick so React can't bail out —
        // an actual commit has to reach the native tree.
        opacity: tick === 0 ? 0.01 : 0.02
      }}
    />
  )
}
