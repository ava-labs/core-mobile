import { useMutation } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { BigIntNAvax } from 'types/denominations'
import { bnToBigint } from 'utils/bigNumbers/bnToBigint'
import { BN } from 'bn.js'
import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'

export const useIssueDelegation = (onSuccess: (txId: string) => void) => {
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const cChainBalance = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(
      activeNetwork.chainId,
      activeAccount?.index
    )
  )
  const cChainBalanceNAvax: BigIntNAvax =
    bnToBigint(cChainBalance || new BN(0)) / BigInt(1e9) //TODO: make function for converting between denominations

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
    onSuccess: onSuccess
  })

  return {
    issueDelegationMutation
  }
}
