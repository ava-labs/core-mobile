import { skipToken, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Address, PublicClient } from 'viem'
import { multicall } from 'viem/actions'
import { selectActiveAccount } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import Logger from 'utils/Logger'
import {
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS
} from '../../consts'
import { AAVE_POOL_DATA_PROVIDER } from '../../abis/aavePoolDataProvider'
import { type BorrowSummaryResult } from '../../types'
import {
  buildAaveBorrowPositions,
  getAaveBorrowSummary
} from '../../utils/aaveBorrowPositionsSummary'
import { buildActualDebtMap } from '../../utils/aaveDebtMap'
import { useNetworkClient } from '../useNetworkClient'
import { useAaveBorrowData } from './useAaveBorrowData'
import { useAaveAvailableMarkets } from './useAaveAvailableMarkets'

const fetchAaveDebtMap = async (
  networkClient: PublicClient,
  userAddress: Address
): Promise<Map<string, bigint>> => {
  const [userReservesRaw, reservesDataRaw] = await multicall(networkClient, {
    contracts: [
      {
        address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
        abi: AAVE_POOL_DATA_PROVIDER,
        functionName: 'getUserReservesData',
        args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS, userAddress]
      },
      {
        address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
        abi: AAVE_POOL_DATA_PROVIDER,
        functionName: 'getReservesData',
        args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS]
      }
    ]
  })

  if (userReservesRaw.status === 'failure') {
    Logger.error('Failed to fetch AAVE user reserves', userReservesRaw.error)
  }
  if (reservesDataRaw.status === 'failure') {
    Logger.error('Failed to fetch AAVE reserves data', reservesDataRaw.error)
  }

  const userReserves = userReservesRaw.result?.[0] ?? []
  const reservesData = reservesDataRaw.result?.[0] ?? []

  return buildActualDebtMap(userReserves, reservesData)
}

export const useAaveBorrowPositionsSummary = (): BorrowSummaryResult => {
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()
  const networkClient = useNetworkClient(cChainNetwork)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: aaveMarkets,
    isLoading: isLoadingAaveMarkets,
    isFetching: isFetchingAaveMarkets,
    refetch: refetchAaveMarkets
  } = useAaveAvailableMarkets({
    network: cChainNetwork,
    networkClient
  })

  const {
    data: aaveBorrowData,
    isLoading: isLoadingAaveBorrowData,
    isFetching: isFetchingAaveBorrowData,
    refetch: refetchAaveBorrowData
  } = useAaveBorrowData()

  const {
    data: aaveDebtMap,
    isLoading: isLoadingAaveDebtMap,
    isFetching: isFetchingAaveDebtMap,
    refetch: refetchAaveDebtMap
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.AAVE_USER_RESERVES_DATA,
      userAddress,
      networkClient?.chain?.id
    ],
    queryFn:
      networkClient && userAddress
        ? () => fetchAaveDebtMap(networkClient, userAddress)
        : skipToken,
    staleTime: 30 * 1000
  })

  const positions = useMemo(() => {
    return buildAaveBorrowPositions({
      markets: aaveMarkets ?? [],
      aaveDebtMap
    })
  }, [aaveMarkets, aaveDebtMap])

  const summary = useMemo(() => {
    if (!aaveBorrowData) {
      return undefined
    }
    return getAaveBorrowSummary({
      markets: aaveMarkets ?? [],
      positions,
      aaveBorrowData
    })
  }, [aaveMarkets, positions, aaveBorrowData])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      refetchAaveMarkets(),
      refetchAaveBorrowData(),
      refetchAaveDebtMap()
    ])
    setIsRefreshing(false)
  }, [refetchAaveMarkets, refetchAaveBorrowData, refetchAaveDebtMap])

  return {
    positions,
    summary,
    isLoading:
      isLoadingAaveMarkets || isLoadingAaveBorrowData || isLoadingAaveDebtMap,
    isFetching:
      isFetchingAaveMarkets ||
      isFetchingAaveBorrowData ||
      isFetchingAaveDebtMap,
    isRefreshing,
    refresh
  }
}
