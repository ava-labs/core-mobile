import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  TokenType,
  type NetworkTokenWithBalance
} from '@avalabs/vm-module-types'

export function convertNativeToTokenWithBalance(
  native: NativeTokenBalance
): NetworkTokenWithBalance {
  const balance = new TokenUnit(native.balance, native.decimals, native.symbol)
  const balanceDisplayValue = balance.toDisplay()
  const priceInCurrency = native.price?.value ?? 0
  const balanceInCurrency = Number(balance.mul(priceInCurrency).toDisplay(2))
  const balanceCurrencyDisplayValue =
    native.balanceValue?.value.toString() ?? '0'

  return {
    name: native.name,
    symbol: native.symbol,
    decimals: native.decimals,
    type: TokenType.NATIVE,
    balance: balance.toSubUnit(),
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
