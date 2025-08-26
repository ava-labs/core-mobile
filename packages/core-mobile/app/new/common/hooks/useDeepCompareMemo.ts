import { useRef } from 'react'
import { deepEqual } from 'fast-equals'

export function useDeepCompareMemo<T>(
  factory: () => T,
  deps: unknown[]
): T | null {
  const prevDepsRef = useRef<unknown[]>([])
  const prevValueRef = useRef<T | null>(null)

  if (!prevDepsRef.current || !deepEqual(prevDepsRef.current, deps)) {
    prevDepsRef.current = deps
    prevValueRef.current = factory()
  }

  return prevValueRef.current
}
