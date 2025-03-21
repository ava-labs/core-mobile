import { NetworkToken } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainTransaction, RewardType } from '@avalabs/glacier-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { fromUnixTime } from 'date-fns'
import { xpChainToken } from 'utils/units/knownTokens'

export const getActiveStakeProgress = (
  stake: PChainTransaction,
  date: Date
): number => {
  const start = fromUnixTime(stake.startTimestamp || 0).getTime()

  const endDate = fromUnixTime(stake.endTimestamp || 0)
  const end = endDate.getTime()
  return (date.getTime() - start) / (end - start)
}

export const formattedEstimatedRewardInAvax = (
  stake: PChainTransaction,
  pChainNetworkToken: NetworkToken,
  fixedDp = 2
): string => {
  const estimatedRewardInAvax = stake.estimatedReward
    ? new TokenUnit(
        stake.estimatedReward,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined
  return estimatedRewardInAvax?.toDisplay({ fixedDp }) ?? UNKNOWN_AMOUNT
}

export const formattedRewardAmountInAvax = (
  stake: PChainTransaction,
  fixedDp = 2
): string => {
  const rewardUtxo = stake.emittedUtxos.find(
    utxo =>
      utxo.rewardType === RewardType.DELEGATOR ||
      utxo.rewardType === RewardType.VALIDATOR
  )
  const rewardAmount = rewardUtxo?.asset.amount
  const rewardAmountInAvax = rewardAmount
    ? new TokenUnit(rewardAmount, xpChainToken.maxDecimals, xpChainToken.symbol)
    : undefined

  return rewardAmountInAvax?.toDisplay({ fixedDp }) ?? UNKNOWN_AMOUNT
}
