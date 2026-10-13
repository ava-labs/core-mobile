import { Stack } from 'common/components/Stack'
import { useNavigation } from 'expo-router'
import SelectNodeScreen from 'features/stake/v2/screens/SelectNodeScreen'
import React, { useState } from 'react'

/**
 * Delegate flow entry: the validator picker pushed when the user chooses
 * "Delegate" from the staking chooser. Node selection comes first in the
 * delegate flow, followed by amount, duration, and confirmation.
 *
 * The stack-level header options render a back button unconditionally, but
 * this screen can also land as the modal stack's only route (the restake
 * fallback `replace`s to here when the original node can't be reused) —
 * where the button wouldn't pop anything: `router.back()` falls through to
 * dismissing the whole modal. So the back button is hidden whenever there is
 * no previous screen in this stack (the sheet gesture still dismisses).
 * Captured once at mount: this screen's position in the stack can't change,
 * and a live subscription would flash the button while screens pushed on top
 * animate away.
 */
export default function DelegateSelectNodeRoute(): JSX.Element {
  const navigation = useNavigation()
  const [hasPreviousScreen] = useState(() => navigation.getState()?.index !== 0)

  return (
    <>
      {!hasPreviousScreen && (
        <Stack.Screen
          options={{ headerLeft: () => null, headerBackVisible: false }}
        />
      )}
      <SelectNodeScreen />
    </>
  )
}
