import debounce from 'lodash.debounce'
import { useCallback, useState } from 'react'

export const useDebouncedState = <T>({
  initialState,
  delay
}: {
  initialState?: T
  delay: number
}): [T | undefined, (value: T) => void] => {
  const [state, setState] = useState<T | undefined>(initialState)

  // Create a stable debounced function using lodash
  const debouncedUpdate = useCallback(
    () =>
      debounce((newValue: T | undefined) => {
        setState(newValue)
      }, delay),
    [delay]
  )

  return [state, debouncedUpdate]
}
