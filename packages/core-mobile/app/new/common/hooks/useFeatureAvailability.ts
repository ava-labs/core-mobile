import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Config from 'react-native-config'

/**
 * Feature whose regional availability can be checked. The value is used as the
 * path segment of the geo proxy endpoint, e.g. `perps` →
 * `${PROXY_URL}/perps/available`. Add new features here as they gain a
 * region-lock endpoint.
 */
export type AvailabilityFeature = 'perps' | 'prediction-markets'

/** Geo rarely changes within a session; avoid hammering the endpoint. */
const STALE_TIME_MS = 5 * 60 * 1000

export type FeatureAvailability = {
  /** `false` when the proxy geo-blocks or the check cannot confirm availability. */
  readonly isAvailable: boolean
  /** First availability check still in flight (no cached answer yet). */
  readonly isLoading: boolean
  /** The availability check failed (should not happen — queryFn never throws). */
  readonly isError: boolean
}

/** Shared query key so the cached check and any fresh re-check stay in sync. */
export const featureAvailabilityQueryKey = (
  feature: AvailabilityFeature
): [ReactQueryKeys, AvailabilityFeature] => [
  ReactQueryKeys.FEATURE_AVAILABILITY,
  feature
]

/**
 * Geo proxy contract: **only HTTP 200** means available. Any other status (403,
 * 404, 5xx, …) or a failed fetch (network error / CORS) means unavailable.
 * Always resolves (never throws) so callers can't accidentally fail open.
 */
export const fetchFeatureAvailability = async (
  feature: AvailabilityFeature,
  signal?: AbortSignal
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${Config.PROXY_URL}/${feature}/available`,
      signal ? { signal } : undefined
    )
    return res.ok && res.status === 200
  } catch (err) {
    // React Query cancellation (unmount / superseded refetch) aborts the
    // signal. Rethrow so RQ discards it — resolving `false` here would cache a
    // spurious "unavailable" for the whole staleTime and falsely geo-block.
    if (signal?.aborted) throw err
    // Network / CORS failure — treat as unavailable (fail closed).
    return false
  }
}

/**
 * Regional availability check, mirroring core-web's geo proxy contract.
 *
 * **Only HTTP 200** means the feature is available. Any other status (403, 404,
 * 5xx, …) or a failed fetch (e.g. network error / CORS on a Cloudflare HTML 403)
 * means unavailable (fail-closed).
 *
 * The queryFn always resolves (never throws) so React Query never enters an
 * error state that would leave `data` undefined and accidentally fail open.
 */
export const useFeatureAvailability = (
  feature: AvailabilityFeature
): FeatureAvailability => {
  const query = useQuery({
    queryKey: featureAvailabilityQueryKey(feature),
    staleTime: STALE_TIME_MS,
    retry: false,
    queryFn: ({ signal }): Promise<boolean> =>
      fetchFeatureAvailability(feature, signal)
  })

  // While pending, assume available so the warning does not flash before the
  // check settles. Once settled, only an explicit `true` means available.
  const isAvailable = query.isPending ? true : query.data === true

  return {
    isAvailable,
    isLoading: query.isPending,
    isError: query.isError
  }
}
