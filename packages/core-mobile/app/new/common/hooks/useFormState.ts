import { useCallback, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'

export function useFormState<T>(initialState: T): {
  formState: T
  initialState: T
  isInitialStateDifferent: boolean
  setFormState: (formState: T) => void
  handleUpdate: (id: string, value?: string) => void
} {
  const [formState, setFormState] = useState<T>(initialState)

  const initialStateRef = useRef<T>(initialState)

  const isInitialStateDifferent = useMemo(() => {
    return !isEqual(formState, initialState)
  }, [formState, initialState])

  const handleUpdate = useCallback(
    (id: string, value?: string) => {
      setFormState(prev => ({ ...prev, [id]: value }))
    },
    [setFormState]
  )

  return {
    formState,
    initialState: initialStateRef.current,
    isInitialStateDifferent,
    setFormState,
    handleUpdate
  }
}
