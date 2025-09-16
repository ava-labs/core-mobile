import {
  useMutation,
  QueryClient,
  UseMutationResult
} from '@tanstack/react-query'
import { useDelegationContext } from 'contexts/DelegationContext'

/**
 * Custom hook to issue a staking delegation transaction.
 *
 * This wraps a React Query mutation and triggers UI callbacks (onSuccess/onError)
 * via state + useEffect rather than directly in the mutation callbacks.
 *
 * Why?
 *  - React Query's `onSuccess`/`onError` are invoked in the same render frame as the mutation resolution.
 *    Triggering heavy UI actions (navigation, dismissing modals, snackbars) in that timing
 *    caused race conditions with native-stack transitions and layout.
 *  - By setting a state value (`delegationTxHash` or `delegationError`) and handling it in `useEffect`,
 *    we ensure the UI callbacks are fired on the next render frame, making transitions more stable.
 */
export const useIssueDelegation = (): {
  issueDelegationMutation: UseMutationResult<
    string,
    Error,
    {
      nodeId: string
      startDate: Date
      endDate: Date
      recomputeSteps?: boolean
    },
    unknown
  >
} => {
  const { delegate, compute, steps, stakeAmount } = useDelegationContext()

  const issueDelegationMutation = useMutation({
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

  return {
    issueDelegationMutation
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
