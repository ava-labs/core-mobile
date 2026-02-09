import { skipToken, useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { multicall } from 'viem/actions'
import { PublicClient } from 'viem'
import Big from 'big.js'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { BENQI_PRICE_ORACLE } from '../../abis/benqiPriceOracle'
import {
  BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
  BENQI_QAVAX_C_CHAIN_ADDRESS,
  BENQI_QI_C_CHAIN_ADDRESS,
  REWARD_DISPLAY_THRESHOLD,
  WAD
} from '../../consts'
import { bigIntToBig } from '../../utils/bigInt'
import { formatAmount } from '../../utils/formatInterest'
import { useBenqiAccountSnapshot } from './useBenqiAccountSnapshot'

const BIG_ZERO = Big(0)

type BenqiRewardAmount = {
  amount: Big
  fiat: Big
}

export type BenqiRewardsData = {
  QI: BenqiRewardAmount
  AVAX: BenqiRewardAmount
  total: BenqiRewardAmount
}

export const useBenqiRewards = ({
  networkClient
}: {
  networkClient: PublicClient | undefined
}): {
  data: BenqiRewardsData | undefined
  isLoading: boolean
  refetch: () => void
} => {
  const { data: accountSnapshot, isLoading: isLoadingAccountSnapshot } =
    useBenqiAccountSnapshot({ networkClient })

  const select = useCallback(
    ({
      qiUsdPrice,
      avaxUsdPrice
    }: {
      qiUsdPrice: number
      avaxUsdPrice: number
    }): BenqiRewardsData => {
      if (!accountSnapshot?.rewards) {
        return {
          QI: { amount: BIG_ZERO, fiat: BIG_ZERO },
          AVAX: { amount: BIG_ZERO, fiat: BIG_ZERO },
          total: { amount: BIG_ZERO, fiat: BIG_ZERO }
        }
      }

      // Process QI rewards
      const benqiQiAmount = formatAmount(
        bigIntToBig(accountSnapshot.rewards.unclaimdQi),
        WAD
      )
      const benqiQiWithThreshold = benqiQiAmount.gte(REWARD_DISPLAY_THRESHOLD)
        ? benqiQiAmount
        : BIG_ZERO
      const benqiQiFiat = benqiQiWithThreshold.mul(qiUsdPrice)

      // Process AVAX rewards
      const benqiAvaxAmount = formatAmount(
        bigIntToBig(accountSnapshot.rewards.unclaimedAvax),
        WAD
      )
      const benqiAvaxWithThreshold = benqiAvaxAmount.gte(
        REWARD_DISPLAY_THRESHOLD
      )
        ? benqiAvaxAmount
        : BIG_ZERO
      const benqiAvaxFiat = benqiAvaxWithThreshold.mul(avaxUsdPrice)

      return {
        QI: {
          amount: benqiQiWithThreshold,
          fiat: benqiQiFiat
        },
        AVAX: {
          amount: benqiAvaxWithThreshold,
          fiat: benqiAvaxFiat
        },
        total: {
          amount: benqiQiWithThreshold.add(benqiAvaxWithThreshold),
          fiat: benqiQiFiat.add(benqiAvaxFiat)
        }
      }
    },
    [accountSnapshot]
  )

  const { data, isLoading, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.BENQI_REWARDS,
      networkClient?.chain?.id,
      accountSnapshot?.rewards?.unclaimdQi?.toString(),
      accountSnapshot?.rewards?.unclaimedAvax?.toString()
    ],
    queryFn:
      networkClient && !isLoadingAccountSnapshot
        ? async () => {
            const [qiPriceRaw, avaxPriceRaw] = await multicall(networkClient, {
              contracts: [
                {
                  address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
                  abi: BENQI_PRICE_ORACLE,
                  functionName: 'getUnderlyingPrice',
                  args: [BENQI_QI_C_CHAIN_ADDRESS]
                },
                {
                  address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
                  abi: BENQI_PRICE_ORACLE,
                  functionName: 'getUnderlyingPrice',
                  args: [BENQI_QAVAX_C_CHAIN_ADDRESS]
                }
              ]
            })

            const safeQiPrice = qiPriceRaw.result ?? 0n
            const safeAvaxPrice = avaxPriceRaw.result ?? 0n
            const qiUsdPrice = formatAmount(
              bigIntToBig(safeQiPrice),
              WAD
            ).toNumber()
            const avaxUsdPrice = formatAmount(
              bigIntToBig(safeAvaxPrice),
              WAD
            ).toNumber()

            return { qiUsdPrice, avaxUsdPrice }
          }
        : skipToken,
    select
  })

  return {
    data,
    isLoading: isLoading || isLoadingAccountSnapshot,
    refetch
  }
}
