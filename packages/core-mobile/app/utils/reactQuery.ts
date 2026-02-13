/**
 * React Query utility functions
 */

/**
 * Exponential backoff with a maximum delay cap for React Query retries
 *
 * @param maxDelayMs - Maximum delay in milliseconds (default: 5000ms)
 * @returns Function compatible with React Query's retryDelay option
 *
 * @example
 * useQuery({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 *   retry: 3,
 *   retryDelay: exponentialBackoff(5000) // 1s, 2s, 4s
 * })
 */
export const exponentialBackoff = (maxDelayMs = 5000) => {
  return (attemptIndex: number): number => {
    return Math.min(1000 * 2 ** attemptIndex, maxDelayMs)
  }
}
