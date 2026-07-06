import { useQueryClient } from '@tanstack/react-query'
import {
  featureAvailabilityQueryKey,
  fetchFeatureAvailability,
  useFeatureAvailability
} from 'common/hooks/useFeatureAvailability'
import { useCallback } from 'react'

export type PerpsAvailability = {
  /** Perps trading is unavailable in this region — block trading surfaces. */
  readonly isGeoBlocked: boolean
  /** Regional availability check still in flight (assume available until settled). */
  readonly isLoading: boolean
  /**
   * Re-run the geo check fresh (bypassing the cache) and resolve to whether
   * perps is now blocked. Call right before a trade submits so a mid-session
   * VPN toggle can't slip an order through on a stale "available".
   */
  readonly recheckGeoBlock: () => Promise<boolean>
}

/**
 * Whether perps trading is geo-blocked for the current location. Thin wrapper
 * over the generic {@link useFeatureAvailability} so perps callers depend on a
 * stable, perps-specific shape rather than the raw availability result.
 */
export const usePerpsAvailability = (): PerpsAvailability => {
  const { isAvailable, isLoading } = useFeatureAvailability('perps')
  const queryClient = useQueryClient()

  const recheckGeoBlock = useCallback(async (): Promise<boolean> => {
    const available = await queryClient.fetchQuery({
      queryKey: featureAvailabilityQueryKey('perps'),
      queryFn: ({ signal }) => fetchFeatureAvailability('perps', signal),
      staleTime: 0
    })
    return !available
  }, [queryClient])

  return { isGeoBlocked: !isAvailable, isLoading, recheckGeoBlock }
}
