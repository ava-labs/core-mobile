import type Big from 'big.js'
import { SECONDS_PER_YEAR } from 'consts/datetime'
import { BIG_TEN } from '@avalabs/core-utils-sdk'
import { RAY, WAD } from '../consts'

/**
 * This converts the unformatted amount denominated in the base on-chain unit (nAvax, wei, satoshi)
 * To the formatted amount denominated in the human readable units (AVAX, ETH, BTC)
 */
export const formatAmount = (amount: Big.Big, decimals: number): Big.Big => {
  return amount.div(BIG_TEN.pow(decimals))
}

export const formatAaveInterest = (bigRateInRay: Big): Big.Big => {
  return formatAmount(bigRateInRay, RAY)
}

export const formatBenqiWadValue = (bigRateInRay: Big): Big.Big => {
  return formatAmount(bigRateInRay, WAD)
}

export const formatAaveSupplyApy = (formattedInterest: Big): number => {
  const apr = formattedInterest.toNumber()
  const apy = (1 + apr / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1
  return apy * 100
}

export const formatBenqiBaseSupplyApy = (formattedSupplyRate: Big): number => {
  const supplyRateNumber = formattedSupplyRate.toNumber()
  return ((1 + supplyRateNumber) ** SECONDS_PER_YEAR - 1) * 100
}
