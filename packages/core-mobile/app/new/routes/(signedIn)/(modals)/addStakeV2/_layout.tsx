import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions,
  useModalScreensOptions
} from 'common/consts/screenOptions'
import { DelegationContextProvider } from 'contexts/DelegationContext'
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
  const { secondaryModalScreensOptions } = useModalScreensOptions()

  // Seed the shared stake amount with the minimum stakable amount on
  // entry so the dial starts at a valid value (and `Next` is enabled
  // immediately, balance permitting) instead of forcing the user to
  // dial up from 0. Also clears any value carried over from a previous
  // flow opened in the same session.
  //
  // Captured via ref so a dev-mode toggle mid-flow (which changes
  // `minStakeAmount`) doesn't stomp on the user's typed value — only
  // the value at modal entry seeds the input.
  const initialAmountRef = useRef(minStakeAmount)
  useEffect(() => {
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
         * The Delegate advanced filters open as a sheet stacked over the
         * node picker (a modal within the add-stake modal), so it gets the
         * secondary-modal presentation rather than the default card push.
         */}
        <Stack.Screen
          name="delegate/advancedFilters"
          options={{
            ...secondaryModalScreensOptions,
            // No header back button — the sheet is dismissed via the footer
            // Cancel/Apply buttons (and the sheet swipe gesture).
            headerLeft: () => null,
            headerBackVisible: false
          }}
        />
      </Stack>
    </DelegationContextProvider>
  )
}
