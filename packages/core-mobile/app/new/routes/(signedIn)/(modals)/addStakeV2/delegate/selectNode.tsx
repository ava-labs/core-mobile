import React from 'react'
import SelectNodeScreen from 'features/stake/v2/screens/SelectNodeScreen'

/**
 * Delegate flow entry: the validator picker pushed when the user chooses
 * "Delegate" from the staking chooser. Node selection comes first in the
 * delegate flow, followed by amount, duration, and confirmation.
 */
export default function DelegateSelectNodeRoute(): JSX.Element {
  return <SelectNodeScreen />
}
