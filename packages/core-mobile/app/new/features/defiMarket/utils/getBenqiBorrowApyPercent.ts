import Big from 'big.js'
import { DAYS_PER_YEAR, SECONDS_PER_DAY } from 'consts/datetime'
import { formatBenqiBaseSupplyApy, formatBenqiWadValue } from './formatInterest'
import { bigIntToBig } from './bigInt'

/**
 * Input for getBenqiBorrowApyPercent
 * All values are from the Lens contract's getMarketMetadataForAllMarkets call.
 *
 * @param avaxPrice - Price of AVAX in USD (scaled by WAD)
 * @param qiBorrowRewardSpeed - QI tokens distributed per second to borrowers (scaled by WAD)
 * @param avaxBorrowRewardSpeed - AVAX tokens distributed per second to borrowers (scaled by WAD)
 * @param qiPrice - Price of QI in USD (scaled by WAD)
 * @param formattedTotalBorrows - Total amount of underlying asset borrowed (already formatted)
 * @param formattedUnderlyingPrice - Price of the underlying asset in USD (already formatted)
 * @param borrowRate - Base borrow rate per second from the interest rate model (scaled by WAD)
 */
type GetBenqiBorrowApyPercentInput = {
  readonly avaxPrice: bigint
  readonly qiBorrowRewardSpeed: bigint
  readonly avaxBorrowRewardSpeed: bigint
  readonly qiPrice: bigint
  readonly formattedTotalBorrows: Big
  readonly formattedUnderlyingPrice: Big
  readonly borrowRate: bigint
}

/**
 * Calculates the live total borrow APY for a Benqi market.
 * - Base APY is from the interest rate model (compounded per second)
 * - QI and AVAX reward APYs reduce the effective borrow cost
 *
 * Note: Borrow APY = Base borrow rate - rewards (rewards offset borrowing costs)
 */
export const getBenqiBorrowApyPercent = ({
  qiBorrowRewardSpeed,
  avaxBorrowRewardSpeed,
  avaxPrice,
  qiPrice,
  formattedTotalBorrows,
  formattedUnderlyingPrice,
  borrowRate
}: GetBenqiBorrowApyPercentInput): number => {
  const borrowRatePerSecond = formatBenqiWadValue(bigIntToBig(borrowRate))
  // Use the same APY formula as supply
  const baseBorrowApyPercent = formatBenqiBaseSupplyApy(borrowRatePerSecond)

  // If there are no borrows, return just the base rate
  if (formattedTotalBorrows.eq(0)) {
    return baseBorrowApyPercent
  }

  const qiBorrowRewardSpeedBig = formatBenqiWadValue(
    bigIntToBig(qiBorrowRewardSpeed)
  )
  const avaxBorrowRewardSpeedBig = formatBenqiWadValue(
    bigIntToBig(avaxBorrowRewardSpeed)
  )
  const qiPriceBig = formatBenqiWadValue(bigIntToBig(qiPrice))
  const avaxPriceBig = formatBenqiWadValue(bigIntToBig(avaxPrice))

  const qiRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: qiBorrowRewardSpeedBig,
    tokenPrice: qiPriceBig,
    totalBorrows: formattedTotalBorrows,
    underlyingPrice: formattedUnderlyingPrice
  })

  const avaxRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: avaxBorrowRewardSpeedBig,
    tokenPrice: avaxPriceBig,
    totalBorrows: formattedTotalBorrows,
    underlyingPrice: formattedUnderlyingPrice
  })

  // Net borrow APY = base rate - rewards (rewards reduce effective borrow cost)
  // But we show positive values, so just return base - rewards (can be negative if rewards > base)
  return baseBorrowApyPercent - qiRewardApyPercent - avaxRewardApyPercent
}

const getTokenRewardApyPercent = ({
  rewardSpeed,
  tokenPrice,
  totalBorrows,
  underlyingPrice
}: {
  rewardSpeed: Big
  tokenPrice: Big
  totalBorrows: Big
  underlyingPrice: Big
}): number => {
  const rewardSpeedNum = Number(rewardSpeed)
  const tokenPriceNum = Number(tokenPrice)
  const totalBorrowsNum = Number(totalBorrows)
  const underlyingPriceNum = Number(underlyingPrice)

  if (totalBorrowsNum === 0 || underlyingPriceNum === 0) {
    return 0
  }

  const dailyReward = rewardSpeedNum * SECONDS_PER_DAY * tokenPriceNum
  const borrowValue = totalBorrowsNum * underlyingPriceNum
  const dailyRate = dailyReward / borrowValue

  return (Math.exp(dailyRate * DAYS_PER_YEAR) - 1) * 100
}
