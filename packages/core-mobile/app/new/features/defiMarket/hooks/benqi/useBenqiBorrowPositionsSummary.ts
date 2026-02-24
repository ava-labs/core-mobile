import { useCallback, useMemo, useState } from 'react'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { type BorrowSummaryResult } from '../../types'
import {
  buildBenqiBorrowPositions,
  getBenqiBorrowSummary
} from '../../utils/benqiBorrowPositionsSummary'
import { useNetworkClient } from '../useNetworkClient'
import { useBenqiAccountSnapshot } from './useBenqiAccountSnapshot'
import { useBenqiAvailableMarkets } from './useBenqiAvailableMarkets'
import { useBenqiBorrowData } from './useBenqiBorrowData'

export const useBenqiBorrowPositionsSummary = (): BorrowSummaryResult => {
  const cChainNetwork = useCChainNetwork()
  const networkClient = useNetworkClient(cChainNetwork)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: benqiMarkets,
    isLoading: isLoadingBenqiMarkets,
    isFetching: isFetchingBenqiMarkets,
    refetch: refetchBenqiMarkets
  } = useBenqiAvailableMarkets({
    network: cChainNetwork,
    networkClient
  })

  const {
    data: benqiBorrowData,
    isLoading: isLoadingBenqiBorrowData,
    isFetching: isFetchingBenqiBorrowData,
    refetch: refetchBenqiBorrowData
  } = useBenqiBorrowData()

  const {
    data: benqiAccountSnapshot,
    isLoading: isLoadingBenqiSnapshot,
    isFetching: isFetchingBenqiSnapshot,
    refetch: refetchBenqiSnapshot
  } = useBenqiAccountSnapshot({ networkClient })

  const benqiDebtMap = useMemo(() => {
    const map = new Map<string, bigint>()
    for (const snapshot of benqiAccountSnapshot?.accountMarketSnapshots ?? []) {
      map.set(snapshot.market.toLowerCase(), snapshot.borrowBalance)
    }

    return map
  }, [benqiAccountSnapshot])

  const positions = useMemo(() => {
    return buildBenqiBorrowPositions({
      markets: benqiMarkets ?? [],
      benqiDebtMap
    })
  }, [benqiMarkets, benqiDebtMap])

  const summary = useMemo(() => {
    if (!benqiBorrowData) {
      return undefined
    }
    return getBenqiBorrowSummary({
      markets: benqiMarkets ?? [],
      positions,
      benqiBorrowData
    })
  }, [benqiMarkets, positions, benqiBorrowData])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      refetchBenqiMarkets(),
      refetchBenqiBorrowData(),
      refetchBenqiSnapshot()
    ])
    setIsRefreshing(false)
  }, [refetchBenqiMarkets, refetchBenqiBorrowData, refetchBenqiSnapshot])

  return {
    positions,
    summary,
    isLoading:
      isLoadingBenqiMarkets ||
      isLoadingBenqiBorrowData ||
      isLoadingBenqiSnapshot,
    isFetching:
      isFetchingBenqiMarkets ||
      isFetchingBenqiBorrowData ||
      isFetchingBenqiSnapshot,
    isRefreshing,
    refresh
  }
}
