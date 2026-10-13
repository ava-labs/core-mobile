import React from 'react'
import DelegateAmountScreen from 'features/stake/v2/screens/DelegateAmountScreen'

/**
 * Advanced delegate "How much do you want to stake?" route. Uses the
 * delegate-specific amount screen (V1's `TokenUnitInputWidget` keypad rather
 * than Fast Stake's `CircularDial`); the screen reads the selected node's
 * delegation capacity internally for validation.
 */
export default function DelegateAmountRoute(): JSX.Element {
  return <DelegateAmountScreen />
}
