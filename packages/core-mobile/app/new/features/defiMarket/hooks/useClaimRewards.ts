import { useCallback, useState } from 'react'
import { encodeFunctionData, Address } from 'viem'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { MERKL_DISTRIBUTOR_ABI } from '../abis/merklDistributor'
import { BENQI_COMPTROLLER_ABI } from '../abis/benqiComptroller'
import {
  MERKL_DISTRIBUTOR_ADDRESS,
  BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
  BENQI_TOKEN_TYPE_QI,
  BENQI_TOKEN_TYPE_AVAX
} from '../consts'
import { useAvailableRewards } from './useAvailableRewards'
import { useMerklUserRewards } from './aave/useMerklUserRewards'

export type ClaimStatus =
  | 'idle'
  | 'claiming'
  | 'claiming-aave'
  | 'claiming-benqi-qi'
  | 'claiming-benqi-avax'

export const useClaimRewards = (): {
  claimAllRewards: () => Promise<void>
  claimStatus: ClaimStatus
  isLoading: boolean
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()

  const { data: availableRewards, refetch: refetchAvailableRewards } =
    useAvailableRewards()
  const { data: merklData } = useMerklUserRewards()

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle')

  const refetchAll = useCallback(() => {
    refetchAvailableRewards()
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.BENQI_ACCOUNT_SNAPSHOT]
    })
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.MERKL_USER_REWARDS]
    })
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.BENQI_REWARDS]
    })
  }, [refetchAvailableRewards])

  const claimAaveRewards = useCallback(
    async (from: Address, chainId: number): Promise<void> => {
      if (!merklData?.claimParams || !merklData?.hasClaimableRewards) return

      setClaimStatus('claiming-aave')

      const claimData = encodeFunctionData({
        abi: MERKL_DISTRIBUTOR_ABI,
        functionName: 'claim',
        args: [
          merklData.claimParams.users,
          merklData.claimParams.tokens,
          merklData.claimParams.amounts,
          merklData.claimParams.proofs
        ]
      })

      await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [{ from, to: MERKL_DISTRIBUTOR_ADDRESS, data: claimData }],
        chainId: getEvmCaip2ChainId(chainId)
      })
    },
    [merklData, request]
  )

  const claimBenqiTokenRewards = useCallback(
    async (params: {
      from: Address
      chainId: number
      symbol: 'QI' | 'AVAX'
      tokenType: typeof BENQI_TOKEN_TYPE_QI | typeof BENQI_TOKEN_TYPE_AVAX
      status: ClaimStatus
    }): Promise<void> => {
      const { from, chainId, symbol, tokenType, status } = params
      const hasRewards =
        availableRewards?.rewards.some(
          r => r.provider === 'benqi' && r.token === symbol
        ) ?? false
      if (!hasRewards) return

      setClaimStatus(status)

      const claimData = encodeFunctionData({
        abi: BENQI_COMPTROLLER_ABI,
        functionName: 'claimReward',
        args: [tokenType, from]
      })

      await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          { from, to: BENQI_COMPTROLLER_C_CHAIN_ADDRESS, data: claimData }
        ],
        chainId: getEvmCaip2ChainId(chainId)
      })
    },
    [availableRewards, request]
  )

  const claimAllRewards = useCallback(async () => {
    if (!addressEVM || !cChainNetwork) {
      return
    }

    setClaimStatus('claiming')

    try {
      await claimAaveRewards(addressEVM, cChainNetwork.chainId)
      await claimBenqiTokenRewards({
        from: addressEVM,
        chainId: cChainNetwork.chainId,
        symbol: 'QI',
        tokenType: BENQI_TOKEN_TYPE_QI,
        status: 'claiming-benqi-qi'
      })
      await claimBenqiTokenRewards({
        from: addressEVM,
        chainId: cChainNetwork.chainId,
        symbol: 'AVAX',
        tokenType: BENQI_TOKEN_TYPE_AVAX,
        status: 'claiming-benqi-avax'
      })

      refetchAll()
      AnalyticsService.capture('EarnClaimSuccess')
    } catch (error) {
      Logger.error('[DefiMarket] claimRewards Error:', error)
      if (!isUserRejectedError(error)) {
        AnalyticsService.capture('EarnClaimFailure', {
          errorMessage:
            error instanceof Error ? error.message : String(error ?? '')
        })
      }
    } finally {
      setClaimStatus('idle')
    }
  }, [
    addressEVM,
    cChainNetwork,
    claimAaveRewards,
    claimBenqiTokenRewards,
    refetchAll
  ])

  return {
    claimAllRewards,
    claimStatus,
    isLoading: claimStatus !== 'idle'
  }
}
