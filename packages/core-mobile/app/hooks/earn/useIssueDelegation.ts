import {
  useMutation,
  useQueryClient,
  QueryClient,
  UseMutationResult
} from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Avax } from 'types/Avax'
import { calculateAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import { assertNotUndefined } from 'utils/assertions'
import NetworkService from 'services/network/NetworkService'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { useCChainBalance } from './useCChainBalance'

export const useIssueDelegation = (
  onSuccess: (txId: string) => void,
  onError: (error: Error) => void,
  onFundsStuck: (error: Error) => void
): {
  issueDelegationMutation: UseMutationResult<
    string,
    Error,
    {
      nodeId: string
      stakingAmount: Avax
      startDate: Date
      endDate: Date
    },
    unknown
  >
} => {
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: cChainBalanceRes } = useCChainBalance()
  const cChainBalance = Avax.fromWei(cChainBalanceRes?.balance ?? 0)

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.addressC ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: async (data: {
      nodeId: string
      stakingAmount: Avax
      startDate: Date
      endDate: Date
    }) => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }

      Logger.trace('importAnyStuckFunds...')
      await EarnService.importAnyStuckFunds({
        activeAccount,
        isDevMode: isDeveloperMode,
        selectedCurrency
      })
      Logger.trace('getPChainBalance...')
      assertNotUndefined(pAddress)

      const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)
      const balancesResponse = await ModuleManager.avalancheModule.getBalances({
        addresses: [pAddress],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: coingeckoInMemoryCache
      })

      const pChainBalance =
        balancesResponse[pAddress]?.[network.networkToken.symbol]
      if (
        pChainBalance === undefined ||
        !isTokenWithBalancePVM(pChainBalance)
      ) {
        return Promise.reject('invalid balance type.')
      }
      const claimableBalance = Avax.fromBase(
        pChainBalance.balancePerType.unlockedUnstaked
      )
      Logger.trace('getPChainBalance: ', claimableBalance.toDisplay())
      const cChainRequiredAmount = calculateAmountForCrossChainTransfer(
        data.stakingAmount,
        claimableBalance
      )
      Logger.trace('cChainRequiredAmount: ', cChainRequiredAmount.toDisplay())
      Logger.trace('collectTokensForStaking...')
      await EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalance: cChainBalance,
        isDevMode: isDeveloperMode,
        requiredAmount: cChainRequiredAmount,
        selectedCurrency
      })
      return EarnService.issueAddDelegatorTransaction({
        activeAccount,
        endDate: data.endDate,
        isDevMode: isDeveloperMode,
        nodeId: data.nodeId,
        stakeAmount: data.stakingAmount.toSubUnit(),
        startDate: data.startDate
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
    },
    onError: error => {
      Logger.error('delegation failed', error)
      if (error instanceof FundsStuckError) {
        onFundsStuck(error)
      } else {
        onError(error)
      }
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
