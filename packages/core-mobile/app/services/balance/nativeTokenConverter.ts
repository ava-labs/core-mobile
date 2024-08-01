import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { BN } from 'bn.js'
import { balanceToDisplayValue, bnToBig } from '@avalabs/core-utils-sdk'
import {
  TokenType,
  type NetworkTokenWithBalance
} from '@avalabs/vm-module-types'

export function convertNativeToTokenWithBalance(
  native: NativeTokenBalance
): NetworkTokenWithBalance {
  const balance = new BN(native.balance)
  const balanceDisplayValue = balanceToDisplayValue(balance, native.decimals)
  const priceInCurrency = native.price?.value ?? 0
  const balanceInCurrency = bnToBig(balance, native.decimals)
    .mul(priceInCurrency)
    .toNumber()
  const balanceCurrencyDisplayValue =
    native.balanceValue?.value.toString() ?? '0'

  return {
    name: native.name,
    symbol: native.symbol,
    decimals: native.decimals,
    type: TokenType.NATIVE,
    balance,
    balanceDisplayValue,
    balanceInCurrency,
    balanceCurrencyDisplayValue,
    priceInCurrency,
    marketCap: 0,
    vol24: 0,
    change24: 0,
    coingeckoId: ''
  }
}
