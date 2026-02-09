import type { Address } from 'viem'
import { LocalTokenWithBalance } from 'store/balance'
import { isNetworkContractToken } from 'utils/isNetworkContractToken'
import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import Big from 'big.js'
import type { DefiAssetBalance } from '../types'
import { bigIntToBig } from './bigInt'

/**
 * Get the valid balance for a specific market.
 * @param marketContractAddress - The address for the market we're checking. This can be the underlying token OR the mint token.
 * @param tokens - The list of tokens to check against.
 * @returns The valid balance for the market.
 */
export const getValidBalanceForMarket = ({
  marketContractAddress,
  tokens
}: {
  marketContractAddress: Address | undefined
  tokens: LocalTokenWithBalance[]
}): DefiAssetBalance => {
  const lowerCaseContractAddress = marketContractAddress?.toLowerCase()

  const maybeToken = tokens.find(token => {
    if (isNetworkContractToken(token)) {
      return lowerCaseContractAddress === token.address.toLowerCase()
    }

    if (!lowerCaseContractAddress) {
      return token.symbol.toLowerCase() === 'avax'
    }
  })

  if (!maybeToken) {
    return {
      balance: 0n,
      balanceValue: {
        value: BIG_ZERO,
        valueString: BIG_ZERO.toString(),
        currencyCode: CurrencyCode.USD
      },
      price: {
        value: BIG_ZERO,
        valueString: BIG_ZERO.toString(),
        currencyCode: CurrencyCode.USD
      }
    }
  }

  return {
    balance: maybeToken.balance,
    balanceValue: {
      value: bigIntToBig(maybeToken.balance),
      valueString: maybeToken.balance.toString(),
      currencyCode: CurrencyCode.USD
    },
    price: {
      value: new Big(maybeToken.priceInCurrency?.toString() ?? '0'),
      valueString: maybeToken.priceInCurrency?.toString() ?? '0',
      currencyCode: CurrencyCode.USD
    }
  }
}
