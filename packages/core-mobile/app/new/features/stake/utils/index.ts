import { NetworkToken } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainTransaction, RewardType } from '@avalabs/glacier-sdk'
import { UTCDate } from '@date-fns/utc'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { fromUnixTime, secondsToMilliseconds } from 'date-fns'
import { getReadableDateDuration } from 'utils/date/getReadableDateDuration'
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

export const getStakeTitle = ({
  stake,
  pChainNetworkToken,
  isActive,
  forCard = true
}: {
  stake: PChainTransaction
  pChainNetworkToken: NetworkToken
  isActive: boolean
  forCard?: boolean
}): string => {
  if (isActive) {
    const remainingTime = getRemainingReadableTime(stake)
    const estimatedRewardInAvaxDisplay = formattedEstimatedRewardInAvax(
      stake,
      pChainNetworkToken
    )
    return `${estimatedRewardInAvaxDisplay} AVAX reward unlocked in ${
      forCard ? '\n' : ''
    }${remainingTime}`
  } else {
    const rewardAmountInAvaxDisplay = formattedRewardAmountInAvax(stake)

    return `${rewardAmountInAvaxDisplay} AVAX reward earned`
  }
}

export const getRemainingReadableTime = (stake: PChainTransaction): string => {
  return getReadableDateDuration(
    new UTCDate(secondsToMilliseconds(stake.endTimestamp || 0))
  )
}

export const getStakedAmount = (
  stake: PChainTransaction,
  pChainNetworkToken: NetworkToken
): TokenUnit | undefined => {
  const stakeAmount = stake.amountStaked?.[0]?.amount

  return stakeAmount
    ? new TokenUnit(
        stakeAmount,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined
}

export const getEstimatedRewardAmount = (
  stake: PChainTransaction,
  pChainNetworkToken: NetworkToken
): TokenUnit | undefined => {
  return stake.estimatedReward
    ? new TokenUnit(
        stake.estimatedReward,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined
}

export const getEarnedRewardAmount = (
  stake: PChainTransaction,
  pChainNetworkToken: NetworkToken
): TokenUnit | undefined => {
  const rewardUtxo = stake.emittedUtxos.find(
    utxo =>
      utxo.rewardType === RewardType.DELEGATOR ||
      utxo.rewardType === RewardType.VALIDATOR
  )
  const rewardAmount = rewardUtxo?.asset.amount
  return rewardAmount
    ? new TokenUnit(
        rewardAmount,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined
}
