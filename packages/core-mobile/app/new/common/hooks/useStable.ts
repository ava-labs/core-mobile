import { useEffect, useRef } from 'react'
import { replaceEqualDeep } from '@tanstack/react-query'

// from https://medium.com/@gfox1984/implementing-the-usestable-value-hook-with-react-query-045999cf5c38
export function useStable<T>(value: T): T {
  const ref = useRef(value)
  const stable = replaceEqualDeep(ref.current, value)
  useEffect(() => {
    ref.current = stable
  }, [stable])
  return stable
}
