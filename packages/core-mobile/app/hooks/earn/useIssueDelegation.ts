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
import { calculateAmountForCrossChainTransferBigint } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import Logger from 'utils/Logger'
import { FundsStuckError } from 'hooks/earn/errors'
import NetworkService from 'services/network/NetworkService'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { isDevnet } from 'utils/isDevnet'
import { selectActiveNetwork } from 'store/network'
import { nanoToWei } from 'utils/units/converter'
import { useCChainBalance } from './useCChainBalance'
import { useGetFeeState } from './useGetFeeState'

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
      stakingAmountNanoAvax: bigint
      startDate: Date
      endDate: Date
      gasPrice?: bigint
      requiredPFeeNanoAvax?: bigint
    },
    unknown
  >
} => {
  const queryClient = useQueryClient()
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: cChainBalanceRes } = useCChainBalance()
  const { getFeeState } = useGetFeeState()
  const cChainBalanceWei = cChainBalanceRes?.balance
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(
      isDeveloperMode,
      isDevnet(activeNetwork)
    )

  const pAddress = activeAccount?.addressPVM ?? ''
  const cAddress = activeAccount?.addressC ?? ''

  const issueDelegationMutation = useMutation({
    mutationFn: async (data: {
      nodeId: string
      stakingAmountNanoAvax: bigint
      startDate: Date
      endDate: Date
      gasPrice?: bigint
      requiredPFeeNanoAvax?: bigint
    }) => {
      if (!activeAccount) {
        return Promise.reject('no active account')
      }
      if (!cChainBalanceWei) {
        return Promise.reject('no C-Chain balance')
      }

      Logger.trace('importAnyStuckFunds...')
      await EarnService.importAnyStuckFunds({
        activeAccount,
        isDevMode: isDeveloperMode,
        selectedCurrency,
        isDevnet: isDevnet(activeNetwork),
        feeState: getFeeState(data.gasPrice)
      }).catch(Logger.error)
      Logger.trace('getPChainBalance...')

      const network = NetworkService.getAvalancheNetworkP(
        isDeveloperMode,
        isDevnet(activeNetwork)
      )
      const balancesResponse = await ModuleManager.avalancheModule.getBalances({
        addresses: [pAddress],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: coingeckoInMemoryCache
      })

      const pChainBalanceResponse = balancesResponse[pAddress]
      if (!pChainBalanceResponse || 'error' in pChainBalanceResponse) {
        return Promise.reject(
          `failed to fetch C-Chain balance. ${pChainBalanceResponse?.error}`
        )
      }
      const pChainBalance = pChainBalanceResponse[network.networkToken.symbol]
      if (
        pChainBalance === undefined ||
        'error' in pChainBalance ||
        !isTokenWithBalancePVM(pChainBalance)
      ) {
        return Promise.reject('invalid balance type.')
      }

      const claimableBalance = pChainBalance.balancePerType.unlockedUnstaked
        ? new TokenUnit(
            pChainBalance.balancePerType.unlockedUnstaked,
            pChainNetworkToken.decimals,
            pChainNetworkToken.symbol
          )
        : undefined

      Logger.trace('getPChainBalance: ', claimableBalance?.toDisplay())
      const cChainRequiredAmountNanoAvax =
        calculateAmountForCrossChainTransferBigint(
          data.stakingAmountNanoAvax + (data.requiredPFeeNanoAvax ?? 0n),
          claimableBalance?.toSubUnit()
        )

      Logger.trace('cChainRequiredAmount: ', cChainRequiredAmountNanoAvax)
      Logger.trace('collectTokensForStaking...')
      await EarnService.collectTokensForStaking({
        activeAccount,
        cChainBalanceWei,
        isDevMode: isDeveloperMode,
        requiredAmountWei: nanoToWei(cChainRequiredAmountNanoAvax),
        selectedCurrency,
        isDevnet: isDevnet(activeNetwork),
        feeState: getFeeState(data.gasPrice)
      })

      return EarnService.issueAddDelegatorTransaction({
        activeAccount,
        endDate: data.endDate,
        isDevMode: isDeveloperMode,
        nodeId: data.nodeId,
        stakeAmountNanoAvax: data.stakingAmountNanoAvax,
        startDate: data.startDate,
        isDevnet: isDevnet(activeNetwork),
        feeState: getFeeState(data.gasPrice)
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
