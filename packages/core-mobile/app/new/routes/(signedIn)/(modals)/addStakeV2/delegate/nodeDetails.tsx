import React from 'react'
import NodeDetailsScreen from 'features/stake/v2/screens/NodeDetailsScreen'

/**
 * Delegate flow: validator details, pushed when a node is tapped in the
 * select-node list. Header chevrons page to the previous/next node in the
 * (filtered/sorted) list via the delegate node-selection store.
 */
export default function DelegateNodeDetailsRoute(): JSX.Element {
  return <NodeDetailsScreen />
}
