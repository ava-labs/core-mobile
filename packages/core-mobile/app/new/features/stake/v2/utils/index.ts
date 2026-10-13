import { NetworkToken } from '@avalabs/core-chains-sdk'
import { PChainTransaction } from '@avalabs/glacier-sdk'
import {
  formattedEstimatedRewardInAvax,
  formattedRewardAmountInAvax,
  getRemainingReadableTime
} from '../../utils'

// Card titles show up to four decimals so small (dust-sized) rewards don't
// collapse to "0.00"; trailing zeros beyond the usual two decimals are
// trimmed so common amounts keep their familiar "1.75" shape.
const TITLE_REWARD_DECIMALS = 4

/** "1.7500" → "1.75", "0.0000" → "0.00", "0.0001" stays — min two decimals. */
const trimTrailingZeros = (value: string): string =>
  value.replace(/(\.\d{2}\d*?)0+$/, '$1')

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
    const estimatedRewardInAvaxDisplay = trimTrailingZeros(
      formattedEstimatedRewardInAvax(
        stake,
        pChainNetworkToken,
        TITLE_REWARD_DECIMALS
      )
    )
    return `${estimatedRewardInAvaxDisplay} AVAX reward unlocked in ${remainingTime}`
  }

  const rewardAmountInAvaxDisplay = trimTrailingZeros(
    formattedRewardAmountInAvax(stake, TITLE_REWARD_DECIMALS)
  )
  return `${rewardAmountInAvaxDisplay} AVAX rewarded`
}
