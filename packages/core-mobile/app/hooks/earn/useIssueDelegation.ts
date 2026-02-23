import {
  useDelegationContext,
  OnDelegationProgress
} from 'contexts/DelegationContext'
import { useCallback } from 'react'
import { useUiSafeMutation } from 'hooks/useUiSafeMutation'
import Logger from 'utils/Logger'
import { FundsStuckError } from './errors'
import { useStakeAmount } from './useStakeAmount'

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
    startDate,
    endDate,
    recomputeSteps,
    onProgress
  }: {
    nodeId: string
    startDate: Date
    endDate: Date
    recomputeSteps?: boolean
    onProgress?: OnDelegationProgress
  }) => Promise<void>
  isPending: boolean
} => {
  const { delegate, computeSteps, steps } = useDelegationContext()
  const [stakeAmount] = useStakeAmount()
  const mutationFn = useCallback(
    async ({
      nodeId,
      startDate,
      endDate,
      recomputeSteps = false,
      onProgress
    }: {
      nodeId: string
      startDate: Date
      endDate: Date
      recomputeSteps?: boolean
      onProgress?: OnDelegationProgress
    }) => {
      if (recomputeSteps) {
        const newSteps = await computeSteps(stakeAmount.toSubUnit())
        return delegate({
          steps: newSteps,
          startDate,
          endDate,
          nodeId,
          onProgress
        })
      }

      return delegate({
        steps,
        startDate,
        endDate,
        nodeId,
        onProgress
      })
    },
    [computeSteps, delegate, steps, stakeAmount]
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
