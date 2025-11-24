import { useDelegationContext } from 'contexts/DelegationContext'
import { useCallback } from 'react'
import { useUiSafeMutation } from 'hooks/useUiSafeMutation'
import Logger from 'utils/Logger'
import { FundsStuckError } from './errors'

export const useIssueDelegation = ({
  onSuccess,
  onError,
  onFundsStuck
}: {
  onSuccess: (txId: string) => void
  onError: (error: Error) => void
  onFundsStuck: (error: Error) => void
}): {
  issueDelegation: ({
    nodeId,
    endDate,
    recomputeSteps
  }: {
    nodeId: string
    endDate: Date
    recomputeSteps?: boolean
  }) => Promise<void>
  isPending: boolean
} => {
  const { delegate, compute, steps, stakeAmount } = useDelegationContext()
  const mutationFn = useCallback(
    async ({
      nodeId,
      endDate,
      recomputeSteps = false
    }: {
      nodeId: string
      endDate: Date
      recomputeSteps?: boolean
    }) => {
      if (recomputeSteps) {
        const newSteps = await compute(stakeAmount.toSubUnit())
        return delegate({
          steps: newSteps,
          endDate,
          nodeId
        })
      }

      return delegate({
        steps,
        endDate,
        nodeId
      })
    },
    [compute, delegate, steps, stakeAmount]
  )

  const handleError = useCallback(
    (error: unknown) => {
      Logger.error('delegation failed', error)
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
      } else if (error instanceof Error) {
        onError(error)
      }
    },
    [onFundsStuck, onError]
  )

  const { safeMutate, isPending } = useUiSafeMutation({
    mutationFn,
    onSuccess,
    onError: handleError
  })

  return {
    issueDelegation: safeMutate,
    isPending
  }
}
