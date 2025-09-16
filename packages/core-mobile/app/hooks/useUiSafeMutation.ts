import { MutationFunction, useMutation } from '@tanstack/react-query'
import { useCallback } from 'react'

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
