import { QueryClient } from '@tanstack/react-query'
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
    startDate,
    endDate,
    recomputeSteps
  }: {
    nodeId: string
    startDate: Date
    endDate: Date
    recomputeSteps?: boolean
  }) => Promise<void>
  isPending: boolean
} => {
  const { delegate, compute, steps, stakeAmount } = useDelegationContext()
  const mutationFn = useCallback(
    async ({
      nodeId,
      startDate,
      endDate,
      recomputeSteps = false
    }: {
      nodeId: string
      startDate: Date
      endDate: Date
      recomputeSteps?: boolean
    }) => {
      if (recomputeSteps) {
        const newSteps = await compute(stakeAmount.toSubUnit())
        return delegate({
          steps: newSteps,
          startDate,
          endDate,
          nodeId
        })
      }

      return delegate({
        steps,
        startDate,
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

/**
 * refetch stakes as well as c + p balances with 2 second delay
 * since glacier will have some delay
 * @param queryClient
 * @param isDeveloperMode
 * @param pAddress
 * @param cAddress
 * @param selectedCurrency
 */

export const refetchQueries = ({
  queryClient,
  isDeveloperMode,
  pAddress,
  cAddress,
  selectedCurrency
}: {
  queryClient: QueryClient
  isDeveloperMode: boolean
  pAddress: string
  cAddress: string
  selectedCurrency: string
}): void => {
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: ['stakes', isDeveloperMode, pAddress]
    })
    queryClient.invalidateQueries({
      queryKey: ['pChainBalance', isDeveloperMode, pAddress]
    })
    queryClient.invalidateQueries({
      queryKey: ['cChainBalance', isDeveloperMode, cAddress, selectedCurrency]
    })
  }, 2000)
}
