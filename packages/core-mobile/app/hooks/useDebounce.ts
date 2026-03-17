import { useState, useEffect, Dispatch, SetStateAction } from 'react'

const DEFAULT_DELAY_IN_MS = 200 // 200ms

export const useDebounce = <T>(
  value: T,
  delay = DEFAULT_DELAY_IN_MS
): { debounced: T; setValueImmediately: Dispatch<SetStateAction<T>> } => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return { debounced: debouncedValue, setValueImmediately: setDebouncedValue }
}
