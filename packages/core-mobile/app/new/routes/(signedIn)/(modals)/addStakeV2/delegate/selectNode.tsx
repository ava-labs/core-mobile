import React from 'react'
import SelectNodeScreen from 'features/stake/v2/screens/SelectNodeScreen'

/**
 * Delegate flow entry: the validator picker pushed when the user chooses
 * "Delegate" from the staking chooser. Node selection comes first in the
 * delegate flow (amount/duration follow once those steps land).
 */
export default function DelegateSelectNodeRoute(): JSX.Element {
  return <SelectNodeScreen />
}
