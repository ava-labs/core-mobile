import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { DelegationContextProvider } from 'contexts/DelegationContext'
import { clearRestakePrefill, takeRestakeEntry } from 'features/stake/v2/store'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import useStakingParams from 'hooks/earn/useStakingParams'
import React, { useEffect, useRef } from 'react'

/**
 * V2 add-stake flow layout.
 *
 * Kept separate from the legacy `addStake` layout because the Fast
 * stake and Delegate flows are expected to diverge significantly from
 * the V1 flow. The chooser lives at the `index` screen; per-flow steps
 * live under their own sub-folders (`fastStake/` today, `delegate/`
 * once that flow lands) so each flow's URL space mirrors its file tree.
 */
export default function StakeLayoutV2(): JSX.Element {
  const [, setStakeAmount] = useStakeAmount()
  const { minStakeAmount } = useStakingParams()

  // Seed the shared stake amount with the minimum stakable amount on
  // entry so the dial starts at a valid value (and `Next` is enabled
  // immediately, balance permitting) instead of forcing the user to
  // dial up from 0. Also clears any value carried over from a previous
  // flow opened in the same session.
  //
  // Captured via ref so a dev-mode toggle mid-flow (which changes
  // `minStakeAmount`) doesn't stomp on the user's typed value — only
  // the value at modal entry seeds the input.
  //
  // Restake entries skip the seed entirely: `useRestake` pre-seeds the
  // original stake's amount before navigating, and this effect runs
  // *after* any child screen's (parent effects fire last on mount), so
  // it would otherwise overwrite the restake amount with the minimum.
  const initialAmountRef = useRef(minStakeAmount)
  useEffect(() => {
    if (takeRestakeEntry()) return
    // Non-restake entry: drop any prefill left behind by a restake that was
    // abandoned mid-flow, so a fresh Fast Stake / Delegate session doesn't
    // inherit the old stake's amount or duration.
    clearRestakePrefill()
    setStakeAmount(initialAmountRef.current)
  }, [setStakeAmount])

  return (
    <DelegationContextProvider>
      <Stack
        screenOptions={modalStackNavigatorScreenOptions}
        initialRouteName="index">
        <Stack.Screen name="index" options={modalFirstScreenOptions} />
        {/*
         * Per-flow sub-folders host the actual amount/duration/confirm
         * screens — `fastStake/` today, `delegate/` once the advanced
         * delegate flow lands. Expo Router auto-discovers nested route
         * files, so most need no explicit Stack.Screen declarations here
         * beyond the chooser's modal-first-screen options.
         */}
        {/*
         * The confirm screens host the left-to-right "slide to stake"
         * button. On iOS 26 the back-pop gesture works across the whole
         * screen content by default (`fullScreenGestureEnabled` maps to
         * react-native-screens' `interactiveContentPopGestureRecognizer`
         * handling and defaults to true there), so sliding the button
         * reads as a back swipe and pops to the duration step mid-slide.
         * Disable the content-wide gesture on these screens only — the
         * edge swipe-back and the header back button still work, and the
         * other steps keep the convenient full-screen back swipe.
         */}
        <Stack.Screen
          name="fastStake/confirm"
          options={{ fullScreenGestureEnabled: false }}
        />
        <Stack.Screen
          name="delegate/confirm"
          options={{ fullScreenGestureEnabled: false }}
        />
      </Stack>
    </DelegationContextProvider>
  )
}
