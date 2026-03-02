import { useCallback, useMemo } from 'react'
import Big from 'big.js'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useMerklUserRewards } from './aave/useMerklUserRewards'
import { useBenqiRewards } from './benqi/useBenqiRewards'
import { useNetworkClient } from './useNetworkClient'

const BIG_ZERO = Big(0)

export type RewardItem = {
  provider: 'aave' | 'benqi'
  token: string
  amount: Big
  fiat: Big
}

export type AvailableRewardsData = {
  rewards: RewardItem[]
  totalRewardsFiat: Big
  hasRewardsToClaim: boolean
}

const defaultRewardResponse = {
  total: {
    amount: BIG_ZERO,
    fiat: BIG_ZERO
  }
}

type RawRewardsData = {
  benqiRewards: typeof defaultRewardResponse &
    Record<string, { amount: Big; fiat: Big }>
  aaveRewards: typeof defaultRewardResponse &
    Record<string, { amount: Big; fiat: Big }>
}

const selectAvailableRewards = (
  rawRewards: RawRewardsData
): AvailableRewardsData => {
  const aaveEntries = Object.entries(rawRewards.aaveRewards).filter(
    ([, value]) => value.amount.gt(0)
  )
  const benqiEntries = Object.entries(rawRewards.benqiRewards).filter(
    ([, value]) => value.amount.gt(0)
  )

  const aaveRewards = aaveEntries
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      provider: 'aave' as const,
      token: key,
      amount: value.amount,
      fiat: value.fiat
    }))

  const benqiRewards = benqiEntries
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      provider: 'benqi' as const,
      token: key,
      amount: value.amount,
      fiat: value.fiat
    }))

  const rewards = [...aaveRewards, ...benqiRewards]
  const totalRewardsFiat = rewards.reduce(
    (acc, reward) => acc.plus(reward.fiat),
    BIG_ZERO
  )
  const hasRewardsToClaim = totalRewardsFiat.gt(0)

  return {
    rewards,
    totalRewardsFiat,
    hasRewardsToClaim
  }
}

export const useAvailableRewards = (): {
  data: AvailableRewardsData
  isLoading: boolean
  refetch: () => void
} => {
  const cChainNetwork = useCChainNetwork()
  const networkClient = useNetworkClient(cChainNetwork)

  const {
    data: merklUserRewards,
    isLoading: isLoadingMerklRewards,
    refetch: refetchMerkl
  } = useMerklUserRewards()

  const {
    data: benqiRewardsRaw,
    isLoading: isLoadingBenqiRewards,
    refetch: refetchBenqiRewards
  } = useBenqiRewards({ networkClient })

  const rewards = useMemo(() => {
    const benqiRewards = benqiRewardsRaw ?? defaultRewardResponse
    const aaveRewards = merklUserRewards?.rewards ?? defaultRewardResponse
    return selectAvailableRewards({
      benqiRewards: benqiRewards as RawRewardsData['benqiRewards'],
      aaveRewards: aaveRewards as RawRewardsData['aaveRewards']
    })
  }, [benqiRewardsRaw, merklUserRewards?.rewards])

  const refetch = useCallback(() => {
    refetchMerkl()
    refetchBenqiRewards()
  }, [refetchBenqiRewards, refetchMerkl])

  return {
    data: rewards,
    isLoading: isLoadingMerklRewards || isLoadingBenqiRewards,
    refetch
  }
}
