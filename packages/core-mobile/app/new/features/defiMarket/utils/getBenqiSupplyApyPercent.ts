import Big from 'big.js'
import { DAYS_PER_YEAR, SECONDS_PER_DAY } from 'consts/datetime'
import { formatBenqiBaseSupplyApy, formatBenqiWadValue } from './formatInterest'
import { bigIntToBig } from './bigInt'

/**
 * Input for getBenqiSupplyApyPercent
 * All values are from the Lens contract's getMarketMetadataForAllMarkets call.
 *
 * @param avaxPrice - Price of AVAX in USD (scaled by WAD)
 * @param qiSupplyRewardSpeed - QI tokens distributed per second to suppliers (scaled by WAD)
 * @param avaxSupplyRewardSpeed - AVAX tokens distributed per second to suppliers (scaled by WAD)
 * @param qiPrice - Price of QI in USD (scaled by WAD)
 * @param formattedUnderlyingTotalSupply - Total amount of underlying asset supplied (already formatted)
 * @param formattedUnderlyingPrice - Price of the underlying asset in USD (already formatted)
 * @param supplyRate - Base supply rate per second from the interest rate model (scaled by WAD)
 *
 * Scales obtained from Benqi contract.
 * See: https://snowtrace.io/address/0x15f30De066D21e4828D78A497d31c665a6162D2D/contract/43114/code
 */
type GetBenqiSupplyApyPercentInput = {
  readonly avaxPrice: bigint
  readonly qiSupplyRewardSpeed: bigint
  readonly avaxSupplyRewardSpeed: bigint
  readonly qiPrice: bigint
  readonly formattedUnderlyingTotalSupply: Big
  readonly formattedUnderlyingPrice: Big
  readonly supplyRate: bigint
}

/**
 * Calculates the live total supply APY for a Benqi market, including base and reward APYs.
 * - Base APY is from the interest rate model (compounded per second)
 * - QI and AVAX reward APYs are from on-chain incentives (compounded daily)
 *
 * This is a synchronous function that uses pre-fetched data from the Lens contract.
 *
 * See: https://gist.github.com/mikkompeltonen/874e36301213952bb9bebe668d296e9c
 */
export const getBenqiSupplyApyPercent = ({
  qiSupplyRewardSpeed,
  avaxSupplyRewardSpeed,
  avaxPrice,
  qiPrice,
  formattedUnderlyingTotalSupply,
  formattedUnderlyingPrice,
  supplyRate
}: GetBenqiSupplyApyPercentInput): number => {
  const supplyRatePerSecond = formatBenqiWadValue(bigIntToBig(supplyRate))
  const baseSupplyApyPercent = formatBenqiBaseSupplyApy(supplyRatePerSecond)

  const qiSupplyRewardSpeedBig = formatBenqiWadValue(
    bigIntToBig(qiSupplyRewardSpeed)
  )
  const avaxSupplyRewardSpeedBig = formatBenqiWadValue(
    bigIntToBig(avaxSupplyRewardSpeed)
  )
  const qiPriceBig = formatBenqiWadValue(bigIntToBig(qiPrice))
  const avaxPriceBig = formatBenqiWadValue(bigIntToBig(avaxPrice))

  const qiRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: qiSupplyRewardSpeedBig,
    tokenPrice: qiPriceBig,
    underlyingTotalSupply: formattedUnderlyingTotalSupply,
    underlyingPrice: formattedUnderlyingPrice
  })

  const avaxRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: avaxSupplyRewardSpeedBig,
    tokenPrice: avaxPriceBig,
    underlyingTotalSupply: formattedUnderlyingTotalSupply,
    underlyingPrice: formattedUnderlyingPrice
  })

  // Total APY = base + QI rewards + AVAX rewards
  return baseSupplyApyPercent + qiRewardApyPercent + avaxRewardApyPercent
}

const getTokenRewardApyPercent = ({
  rewardSpeed,
  tokenPrice,
  underlyingTotalSupply,
  underlyingPrice
}: {
  rewardSpeed: Big
  tokenPrice: Big
  underlyingTotalSupply: Big
  underlyingPrice: Big
}): number => {
  // Calculate reward APY (compounded daily)
  //    APY = ((rewardSpeed * 86400 * tokenPrice) / (underlyingTotalSupply * underlyingPrice) + 1) ** 365 - 1

  // Convert to numbers early for performance
  const rewardSpeedNum = Number(rewardSpeed)
  const avaxPriceNum = Number(tokenPrice)
  const totalSupplyNum = Number(underlyingTotalSupply)
  const underlyingPriceNum = Number(underlyingPrice)

  // Calculate daily rate (r)
  const dailyReward = rewardSpeedNum * SECONDS_PER_DAY * avaxPriceNum
  const supplyValue = totalSupplyNum * underlyingPriceNum
  const dailyRate = dailyReward / supplyValue

  // Approximate compound interest using e^(r*n)
  return (Math.exp(dailyRate * DAYS_PER_YEAR) - 1) * 100
}
