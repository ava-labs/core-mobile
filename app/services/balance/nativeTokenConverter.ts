import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { NetworkTokenWithBalance, TokenType } from 'store/balance'
import { BN } from 'bn.js'
import { balanceToDisplayValue, bnToBig } from '@avalabs/utils-sdk'

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
    description: '',
    decimals: native.decimals,
    logoUri: native.logoUri ?? '',
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
