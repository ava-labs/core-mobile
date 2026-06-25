import {
  useDelegationContext,
  OnDelegationProgress
} from 'contexts/DelegationContext'
import { useCallback } from 'react'
import { useUiSafeMutation } from 'hooks/useUiSafeMutation'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { AdditionalDelegatorOutput } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { FundsStuckError } from './errors'
import { useStakeAmount } from './useStakeAmount'

type IssueDelegationParams = {
  nodeId: string
  startDate: Date
  endDate: Date
  recomputeSteps?: boolean
  onProgress?: OnDelegationProgress
  /**
   * Extra outputs bundled atomically with the delegation tx (Fast Stake's
   * convenience-fee escrow output). When omitted, the delegation tx has no
   * extra outputs.
   */
  additionalOutputs?: readonly AdditionalDelegatorOutput[]
}

export const useIssueDelegation = ({
  onSuccess,
  onError,
  onFundsStuck
}: {
  onSuccess: (txId: string) => void
  onError: (error: Error) => void
  onFundsStuck: (error: Error) => void
}): {
  issueDelegation: (params: IssueDelegationParams) => Promise<void>
  isPending: boolean
  reset: () => void
} => {
  const { delegate, computeSteps, steps } = useDelegationContext()
  const [stakeAmount] = useStakeAmount()
  const mutationFn = useCallback(
    async ({
      nodeId,
      startDate,
      endDate,
      recomputeSteps = false,
      onProgress,
      additionalOutputs
    }: IssueDelegationParams) => {
      if (recomputeSteps) {
        // Extra outputs (convenience fee) are funded from P-Chain inputs
        // together with the stake, so the step computation needs their total
        // to import/transfer enough. Sum them here and pass it through.
        const additionalOutputAmount =
          additionalOutputs?.reduce((sum, output) => sum + output.amount, 0n) ??
          0n
        const newSteps = await computeSteps(
          stakeAmount.toSubUnit(),
          additionalOutputAmount
        )
        return delegate({
          steps: newSteps,
          startDate,
          endDate,
          nodeId,
          onProgress,
          additionalOutputs
        })
      }

      return delegate({
        steps,
        startDate,
        endDate,
        nodeId,
        onProgress,
        additionalOutputs
      })
    },
    [computeSteps, delegate, steps, stakeAmount]
  )

  const handleError = useCallback(
    (error: unknown) => {
      if (!isUserRejectedError(error)) {
        Logger.error('delegation failed', error)
      }
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
      } else if (error instanceof Error) {
        onError(error)
      }
    },
    [onFundsStuck, onError]
  )

  const { safeMutate, isPending, safeReset } = useUiSafeMutation({
    mutationFn,
    onSuccess,
    onError: handleError
  })

  return {
    issueDelegation: safeMutate,
    isPending,
    reset: safeReset
  }
}
