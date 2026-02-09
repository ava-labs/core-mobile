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

  const claimAllRewards = useCallback(async () => {
    if (!addressEVM || !cChainNetwork) {
      return
    }

    setClaimStatus('claiming')

    try {
      // 1. Claim Aave rewards via Merkl Distributor
      if (merklData?.claimParams && merklData?.hasClaimableRewards) {
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
          params: [
            {
              from: addressEVM,
              to: MERKL_DISTRIBUTOR_ADDRESS,
              data: claimData
            }
          ],
          chainId: getEvmCaip2ChainId(cChainNetwork.chainId)
        })
      }

      // 2. Claim Benqi QI rewards
      const hasBenqiQiRewards =
        availableRewards?.rewards.some(
          r => r.provider === 'benqi' && r.token === 'QI'
        ) ?? false

      if (hasBenqiQiRewards) {
        setClaimStatus('claiming-benqi-qi')

        const claimQiData = encodeFunctionData({
          abi: BENQI_COMPTROLLER_ABI,
          functionName: 'claimReward',
          args: [BENQI_TOKEN_TYPE_QI, addressEVM]
        })

        await request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [
            {
              from: addressEVM,
              to: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
              data: claimQiData
            }
          ],
          chainId: getEvmCaip2ChainId(cChainNetwork.chainId)
        })
      }

      // 3. Claim Benqi AVAX rewards
      const hasBenqiAvaxRewards =
        availableRewards?.rewards.some(
          r => r.provider === 'benqi' && r.token === 'AVAX'
        ) ?? false

      if (hasBenqiAvaxRewards) {
        setClaimStatus('claiming-benqi-avax')

        const claimAvaxData = encodeFunctionData({
          abi: BENQI_COMPTROLLER_ABI,
          functionName: 'claimReward',
          args: [BENQI_TOKEN_TYPE_AVAX, addressEVM]
        })

        await request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [
            {
              from: addressEVM,
              to: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
              data: claimAvaxData
            }
          ],
          chainId: getEvmCaip2ChainId(cChainNetwork.chainId)
        })
      }

      // Refetch all rewards data after claiming
      refetchAll()
      AnalyticsService.capture('EarnClaimSuccess')
    } catch (error) {
      Logger.error('[DefiMarket] claimRewards Error:', error)
      AnalyticsService.capture('EarnClaimFailure')
    } finally {
      setClaimStatus('idle')
    }
  }, [
    addressEVM,
    cChainNetwork,
    merklData,
    availableRewards,
    request,
    refetchAll
  ])

  return {
    claimAllRewards,
    claimStatus,
    isLoading: claimStatus !== 'idle'
  }
}
