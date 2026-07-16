import AdvancedFiltersScreen from 'features/stake/v2/screens/AdvancedFiltersScreen'
import React from 'react'

/**
 * Advanced filters for the Delegate validator picker (uptime, fee, available
 * capacity, time remaining). A ROOT-level secondary sheet stacked over the
 * add-stake modal — deliberately NOT nested inside the addStakeV2 stack:
 * react-native-screens' Android formSheet breaks when hosted by a nested
 * stack (the sheet's insets pass races the behavior attachment — see the
 * `react-native-screens+4.25.2` patch), while root-level sheets over modals
 * are the app-wide, proven pattern (e.g. the swap token selectors).
 * Selections apply via the delegate filter store, so no params are needed.
 */
export default function StakeAdvancedFiltersRoute(): JSX.Element {
  return <AdvancedFiltersScreen />
}
