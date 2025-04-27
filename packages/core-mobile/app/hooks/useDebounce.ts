import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export const useDebounce = <T>(
  value: T,
  delay: number
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
