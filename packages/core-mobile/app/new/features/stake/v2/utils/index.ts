import { NetworkToken } from '@avalabs/core-chains-sdk'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import {
  formattedEstimatedRewardInAvax,
  formattedRewardAmountInAvax,
  getRemainingReadableTime
} from '../../utils'

/**
 * V2 stake card title.
 *
 * Differs from the V1 `getStakeTitle` in two ways:
 * - Completed copy reads "X AVAX rewarded" instead of "X AVAX reward earned".
 * - Active title is a single string with no forced newline (the V2 card is
 *   wider, so the text wraps naturally).
 */
export const getStakeTitle = ({
  stake,
  pChainNetworkToken,
  isActive
}: {
  stake: PChainTransaction
  pChainNetworkToken: NetworkToken
  isActive: boolean
}): string => {
  if (isActive) {
    const remainingTime = getRemainingReadableTime(stake)
    const estimatedRewardInAvaxDisplay = formattedEstimatedRewardInAvax(
      stake,
      pChainNetworkToken
    )
    return `${estimatedRewardInAvaxDisplay} AVAX reward unlocked in ${remainingTime}`
  }

  const rewardAmountInAvaxDisplay = formattedRewardAmountInAvax(stake)
  return `${rewardAmountInAvaxDisplay} AVAX rewarded`
}
