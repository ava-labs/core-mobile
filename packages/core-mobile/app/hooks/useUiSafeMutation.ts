import { MutationFunction, useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * A wrapper around React Query's `useMutation` that ensures
 * `onSuccess` and `onError` callbacks run inside a `requestAnimationFrame`.
 *
 * This prevents timing issues where heavy UI updates (toast, navigation, etc.)
 * might be ignored if they are triggered directly inside React Query callbacks.
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
  const { mutateAsync, isPending } = useMutation({
    mutationFn: mutationFn
  })

  const safeMutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      try {
        const data = await mutateAsync(variables)

        requestAnimationFrame(() => {
          onSuccess(data)
        })
      } catch (e) {
        if (e instanceof Error) {
          requestAnimationFrame(() => {
            onError(e)
          })
        }
      }
    },
    [mutateAsync, onSuccess, onError]
  )

  return {
    safeMutate,
    isPending
  }
}
