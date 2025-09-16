import { useMutation, QueryClient } from '@tanstack/react-query'
import { useDelegationContext } from 'contexts/DelegationContext'
import { useCallback } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
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

  const { mutateAsync: issueDelegationMutateAsync, isPending } = useMutation({
    mutationFn: async ({
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
    }
  })

  const issueDelegation = useCallback(
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
    }): Promise<void> => {
      AnalyticsService.capture('StakeIssueDelegation')

      try {
        const txHash = await issueDelegationMutateAsync({
          startDate,
          endDate,
          nodeId,
          recomputeSteps
        })

        onSuccess(txHash)
      } catch (e) {
        Logger.error('delegation failed', e)
        if (e instanceof FundsStuckError) {
          onFundsStuck(e)
        } else if (e instanceof Error) {
          onError(e)
        }
      }
    },
    [issueDelegationMutateAsync, onSuccess, onError, onFundsStuck]
  )

  return {
    issueDelegation,
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
