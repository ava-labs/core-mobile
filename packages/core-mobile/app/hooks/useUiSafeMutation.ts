import { MutationFunction, useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

/**
 * A wrapper around React Query's `useMutation` that ensures
 * `onSuccess` and `onError` callbacks run inside a `setTimeout`.
 *
 * Why `setTimeout`?
 * 1. Crash Prevention: Unlike `requestAnimationFrame`, it decouples execution from the render loop,
 * preventing memory/CPU spikes when multiple screens are stacked in the background.
 * 2. Execution Guarantee: Unlike `InteractionManager`, it ensures callbacks run even if
 * there are ongoing animations or stuck interactions.
 * 3. Timing Safety: Pushes UI updates to the next event loop tick, avoiding conflicts
 * with navigation transitions or component mounting.
 *
 * Usage:
 * const { safeMutate, isPending } = useUiSafeMutation({
 *   mutationFn: async (vars) => apiCall(vars),
 *   onSuccess: (data) => showToast('Success!'),
 *   onError: (err) => showToast(`Error: ${err.message}`),
 * })
 *
 * await safeMutate(vars)
 */
export const useUiSafeMutation = <TData, TVariables = void>({
  mutationFn,
  onSuccess,
  onError
}: {
  mutationFn: MutationFunction<TData, TVariables>
  onSuccess: (data: TData) => void
  onError: (error: Error) => void
}): {
  safeMutate: (variables: TVariables) => Promise<void>
  isPending: boolean
} => {
  const { mutateAsync, isPending } = useMutation({ mutationFn })

  const isMountedRef = useRef(true)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const safeMutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      try {
        const data = await mutateAsync(variables)

        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onSuccess(data)
          }
        }, 1)
      } catch (e) {
        if (e instanceof Error) {
          timerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onError(e)
            }
          }, 1)
        }
      }
    },
    [mutateAsync, onSuccess, onError]
  )

  return { safeMutate, isPending }
}
