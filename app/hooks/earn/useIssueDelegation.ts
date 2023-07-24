import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { BigIntNAvax, BigIntWeiAvax } from 'types/denominations'
import { BN } from 'bn.js'
import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import BigIntConverter from 'types/converters/BigIntConverter'
import TypeConverter from 'types/converters/TypeConverter'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryClient } from '@tanstack/query-core'

export const useIssueDelegation = (onSuccess: (txId: string) => void) => {
  const queryClient = useQueryClient()
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const cChainBalanceWei = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(
      activeNetwork.chainId,
      activeAccount?.index
    )
  )
  const cChainBalanceBigIntWei = TypeConverter.bnToBigInt(
    cChainBalanceWei || new BN(0)
  ) as BigIntWeiAvax
  const cChainBalanceNAvax: BigIntNAvax = BigIntConverter.weiToNAvax(
    cChainBalanceBigIntWei
  )

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.address ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: (data: {
      nodeId: string
      stakingAmount: BigIntNAvax
      startDate: Date
      endDate: Date
    }) => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }

      return EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalance: cChainBalanceNAvax,
        isDevMode: isDeveloperMode,
        requiredAmount: data.stakingAmount
      }).then(successfullyCollected => {
        if (successfullyCollected) {
          return EarnService.issueAddDelegatorTransaction({
            activeAccount,
            endDate: data.endDate,
            isDevMode: isDeveloperMode,
            nodeId: data.nodeId,
            stakeAmount: data.stakingAmount,
            startDate: data.startDate
          })
        } else {
          throw Error('Something went wrong')
        }
      })
    },
    onSuccess: txId => {
      refetchQueries({
        isDeveloperMode,
        queryClient,
        pAddress,
        cAddress,
        selectedCurrency
      })
      // handle UI success state
      onSuccess(txId)
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
}) => {
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
