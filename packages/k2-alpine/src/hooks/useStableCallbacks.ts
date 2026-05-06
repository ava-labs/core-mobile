import { useCallback, useEffect, useRef } from 'react'

/**
 * Stabilises one or two callbacks behind refs so memoized children bail on
 * re-renders even when callers pass fresh identities. Returned functions
 * are identity-stable; refs refresh via effect to keep closures current.
 */
export const useStableCallbacks = <Args extends unknown[]>(
  primary: (...args: Args) => void,
  secondary?: (...args: Args) => void
): {
  stablePrimary: (...args: Args) => void
  stableSecondary: (...args: Args) => void
} => {
  const primaryRef = useRef(primary)
  const secondaryRef = useRef(secondary)
  useEffect(() => {
    primaryRef.current = primary
  }, [primary])
  useEffect(() => {
    secondaryRef.current = secondary
  }, [secondary])
  const stablePrimary = useCallback(
    (...args: Args) => primaryRef.current(...args),
    []
  )
  const stableSecondary = useCallback(
    (...args: Args) => secondaryRef.current?.(...args),
    []
  )
  return { stablePrimary, stableSecondary }
}
