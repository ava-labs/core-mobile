import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsK2AlpineBlocked } from 'store/posthog/slice'

/**
 * This HoC is used to implement a gradual rollout of the new K2 Alpine design.
 *
 * It does the following:
 * - conditionally renders either the old or the new version of a component based on K2 ALPINE feature flag.
 * - ensures both the old and new components are interchangeable by enforcing that they accept the same props.
 * - ensures that both old and new components are lazily loaded via React.lazy.
 *
 * Example usage:
 * const WatchlistTab = withK2Alpine(
 *  lazy(() => import('screens/watchlist/WatchlistTabView')),
 *  lazy(() => import('screens/watchlist/WatchlistTabViewK2Alpine'))
 * )
 */
export const withK2Alpine = <P extends object>(
  OldComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  NewComponent: React.LazyExoticComponent<React.ComponentType<P>>
): React.ComponentType<P> => {
  return (props: P) => {
    const isK2AlpineBlocked = useSelector(selectIsK2AlpineBlocked)
    const Component = isK2AlpineBlocked ? OldComponent : NewComponent
    // @ts-ignore react lazy doesn't work well with generic typing
    return <Component {...props} />
  }
}
