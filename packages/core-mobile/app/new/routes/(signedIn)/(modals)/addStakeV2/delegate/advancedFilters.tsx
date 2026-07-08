import React from 'react'
import AdvancedFiltersScreen from 'features/stake/v2/screens/AdvancedFiltersScreen'

/**
 * Advanced filters for the Delegate validator picker (uptime, fee, available
 * capacity, time remaining). Presented as a modal over the
 * select-node screen; selections are applied via the delegate filter store.
 */
export default function DelegateAdvancedFiltersRoute(): JSX.Element {
  return <AdvancedFiltersScreen />
}
