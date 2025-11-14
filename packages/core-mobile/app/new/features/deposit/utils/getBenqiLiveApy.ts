import type { Address, Client } from 'viem'
import { readContract } from 'viem/actions'
import Big from 'big.js'
import { DAYS_PER_YEAR, SECONDS_PER_DAY } from 'consts/datetime'
import { BENQI_COMPTROLLER } from '../abis/benqiComptroller'
import { BENQI_PRICE_ORACLE } from '../abis/benqiPriceOracle'
import { BENQI_Q_TOKEN } from '../abis/benqiQToken'
import {
  BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
  BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
  BENQI_QAVAX_C_CHAIN_ADDRESS,
  BENQI_QI_C_CHAIN_ADDRESS,
  BENQI_TOKEN_TYPE_AVAX,
  BENQI_TOKEN_TYPE_QI
} from '../consts'
import {
  formatAmount,
  formatBenqiBaseSupplyApy,
  formatBenqiWadValue
} from './formatInterest'
import { bigIntToBig } from './bigInt'

/**
 * Input for getBenqiSupplyApyPercent
 * - underlyingTokenDecimals: decimals of the underlying asset (e.18 for USDC)
 * - cChainClient: viem Client instance
 * - qTokenAddress: address of the Benqi qToken (e.qAUSD)
 */
type GetBenqiSupplyApyPercentInput = {
  readonly qTokenAddress: Address
  readonly underlyingTokenDecimals: number
  readonly underlyingTotalSupply: Big
  readonly cChainClient: Client
}

/**
 * Calculates the live total supply APY for a Benqi market, including base and reward APYs.
 * - Base APY is from the interest rate model (compounded per second)
 * - QI and AVAX reward APYs are from on-chain incentives (compounded daily)
 *
 * See: https://gist.github.com/mikkompeltonen/874e36301213952bb9bebe668d296e9c
 */
export const getBenqiSupplyApyPercent = async ({
  qTokenAddress,
  underlyingTokenDecimals,
  underlyingTotalSupply,
  cChainClient
}: GetBenqiSupplyApyPercentInput): Promise<number> => {
  // Fetch per-second supply rate (scaled by 1e18 (WAD))
  const supplyRatePerSecondRaw = await readContract(cChainClient, {
    address: qTokenAddress,
    abi: BENQI_Q_TOKEN,
    functionName: 'supplyRatePerTimestamp'
  })
  // Convert to decimal (divide by 1e18 (WAD))
  const supplyRatePerSecond = formatBenqiWadValue(
    bigIntToBig(supplyRatePerSecondRaw)
  )

  // Calculate base supply APY (compounded per second)
  //    APY = (1 + rate) ** SECONDS_PER_YEAR - 1
  const baseSupplyApyPercent = formatBenqiBaseSupplyApy(supplyRatePerSecond)

  // Fetch QI and AVAX supply reward speeds (per second, scaled by 1e18 (WAD))
  const qiRewardSpeedRaw = await readContract(cChainClient, {
    address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
    abi: BENQI_COMPTROLLER,
    functionName: 'supplyRewardSpeeds',
    args: [BENQI_TOKEN_TYPE_QI, qTokenAddress]
  })
  const qiRewardSpeed = formatBenqiWadValue(bigIntToBig(qiRewardSpeedRaw))
  const avaxRewardSpeedRaw = await readContract(cChainClient, {
    address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
    abi: BENQI_COMPTROLLER,
    functionName: 'supplyRewardSpeeds',
    args: [BENQI_TOKEN_TYPE_AVAX, qTokenAddress]
  })
  const avaxRewardSpeed = formatBenqiWadValue(bigIntToBig(avaxRewardSpeedRaw))
  // Fetch QI, AVAX, and underlying asset prices
  //    QI price: getUnderlyingPrice(QI token address), scaled by 1e18 (WAD)
  const qiPriceRaw = await readContract(cChainClient, {
    address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
    abi: BENQI_PRICE_ORACLE,
    functionName: 'getUnderlyingPrice',
    args: [BENQI_QI_C_CHAIN_ADDRESS]
  })
  const qiPrice = formatBenqiWadValue(bigIntToBig(qiPriceRaw))
  //    AVAX price: getUnderlyingPrice(qAVAX address), scaled by 1e18 (WAD)
  const avaxPriceRaw = await readContract(cChainClient, {
    address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
    abi: BENQI_PRICE_ORACLE,
    functionName: 'getUnderlyingPrice',
    args: [BENQI_QAVAX_C_CHAIN_ADDRESS]
  })
  const avaxPrice = formatBenqiWadValue(bigIntToBig(avaxPriceRaw))
  //    Underlying asset price: getUnderlyingPrice(qToken address), scaled by 1e(36-underlyingDecimals)
  const underlyingPriceRaw = await readContract(cChainClient, {
    address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
    abi: BENQI_PRICE_ORACLE,
    functionName: 'getUnderlyingPrice',
    args: [qTokenAddress]
  })
  const underlyingPrice = formatAmount(
    bigIntToBig(underlyingPriceRaw),
    36 - underlyingTokenDecimals
  )

  const qiRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: qiRewardSpeed,
    tokenPrice: qiPrice,
    underlyingTotalSupply,
    underlyingPrice
  })

  const avaxRewardApyPercent = getTokenRewardApyPercent({
    rewardSpeed: avaxRewardSpeed,
    tokenPrice: avaxPrice,
    underlyingTotalSupply,
    underlyingPrice
  })

  // Total APY = base + QI rewards + AVAX rewards
  return baseSupplyApyPercent + qiRewardApyPercent + avaxRewardApyPercent
}

export const getTokenRewardApyPercent = ({
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
