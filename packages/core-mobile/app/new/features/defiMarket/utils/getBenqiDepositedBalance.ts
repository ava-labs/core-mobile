import Big from 'big.js'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import type { DefiAssetBalance } from '../types'
import { formatAmount } from './formatInterest'
import { bigIntToBig } from './bigInt'

/**
 * Calculates the deposited balance for a Benqi market using pre-fetched data.
 * This is a synchronous function that uses data from the Lens contract.
 *
 * @param balanceOfUnderlying - Raw balance from account snapshot
 * @param underlyingTokenDecimals - Decimals of the underlying token
 * @param formattedUnderlyingPrice - Pre-formatted price of the underlying asset
 */
export const getBenqiDepositedBalance = ({
  balanceOfUnderlying,
  underlyingTokenDecimals,
  formattedUnderlyingPrice
}: {
  balanceOfUnderlying: bigint
  underlyingTokenDecimals: number
  formattedUnderlyingPrice: Big
}): DefiAssetBalance => {
  const formattedBalance = formatAmount(
    bigIntToBig(balanceOfUnderlying),
    underlyingTokenDecimals
  )
  const balanceValue = formattedBalance.mul(formattedUnderlyingPrice)

  return {
    balance: balanceOfUnderlying,
    balanceValue: {
      value: balanceValue,
      valueString: balanceValue.toString(),
      currencyCode: CurrencyCode.USD
    },
    price: {
      value: formattedUnderlyingPrice,
      valueString: formattedUnderlyingPrice.toString(),
      currencyCode: CurrencyCode.USD
    }
  }
}
