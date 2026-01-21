import { skipToken, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Big from 'big.js'
import { Address } from 'viem'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { ChainId } from '@avalabs/core-chains-sdk'
import { MERKL_API_URL, MERKL_STALE_TIME_MS } from '../../consts'
import { bigIntToBig } from '../../utils/bigInt'
import { formatAmount } from '../../utils/formatInterest'

const BIG_ZERO = Big(0)

type MerklRewardToken = {
  address: Address
  chainId: number
  symbol: string
  decimals: number
  price?: number
}

type MerklRewardItem = {
  token: MerklRewardToken
  amount: bigint
  claimed: string
  pending: string
  breakdowns: {
    reason: string
    amount: string
    claimed: string
    pending: string
  }[]
  root: string
  recipient: Address
  proofs: Address[]
}

type MerklRewardsResponse = {
  rewards: MerklRewardItem[]
}[]

type MerklClaimParams = {
  users: Address[]
  tokens: Address[]
  amounts: bigint[]
  proofs: Address[][]
}

type MerklRewardAmount = {
  amount: Big
  fiat: Big
}

export type MerklRewards = {
  [symbol: string]: MerklRewardAmount
  total: MerklRewardAmount
}

export const useMerklUserRewards = (): {
  data:
    | {
        claimParams: MerklClaimParams
        rewards: MerklRewards
        hasClaimableRewards: boolean
      }
    | undefined
  isLoading: boolean
  refetch: () => void
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC as Address | undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: [ReactQueryKeys.MERKL_USER_REWARDS, addressEVM],
    queryFn: addressEVM
      ? async () => {
          const response = await fetch(
            `${MERKL_API_URL}/users/${addressEVM}/rewards?chainId=${ChainId.AVALANCHE_MAINNET_ID}&claimableOnly=true`
          )

          if (!response.ok) {
            throw new Error('Failed to fetch Merkl user rewards')
          }

          const rawData: MerklRewardsResponse = await response.json()

          // Process claim params
          const claimParams = rawData.reduce<MerklClaimParams>(
            (acc, reward) => {
              reward.rewards.forEach(rewardItem => {
                acc.users.push(rewardItem.recipient)
                acc.tokens.push(rewardItem.token.address)
                acc.amounts.push(rewardItem.amount)
                acc.proofs.push(rewardItem.proofs)
              })
              return acc
            },
            {
              users: [],
              tokens: [],
              amounts: [],
              proofs: []
            }
          )

          // Process formatted rewards
          const formattedRewards = rawData.reduce<MerklRewards>(
            (acc, reward) => {
              reward.rewards.forEach(rewardItem => {
                const symbol = rewardItem.token.symbol
                const newAmountBig = bigIntToBig(rewardItem.amount)
                const formattedAmountValue = formatAmount(
                  newAmountBig,
                  rewardItem.token.decimals
                )

                const newFiatAmount = formattedAmountValue.times(
                  rewardItem.token.price ?? 0
                )

                if (!acc[symbol]) {
                  acc[symbol] = {
                    amount: BIG_ZERO,
                    fiat: BIG_ZERO
                  }
                }

                acc[symbol] = {
                  amount: acc[symbol].amount.plus(formattedAmountValue),
                  fiat: acc[symbol].fiat.plus(newFiatAmount)
                }

                // Update total
                acc.total = {
                  amount: acc.total.amount.plus(formattedAmountValue),
                  fiat: acc.total.fiat.plus(newFiatAmount)
                }
              })
              return acc
            },
            {
              total: {
                amount: BIG_ZERO,
                fiat: BIG_ZERO
              }
            }
          )

          const hasClaimableRewards = rawData.some(reward =>
            reward.rewards.some(rewardItem => rewardItem.amount > 0)
          )

          return {
            claimParams,
            rewards: formattedRewards,
            hasClaimableRewards
          }
        }
      : skipToken,
    staleTime: MERKL_STALE_TIME_MS
  })

  return {
    data,
    isLoading,
    refetch
  }
}
