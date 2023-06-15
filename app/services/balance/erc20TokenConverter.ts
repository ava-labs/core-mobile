import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { TokenType, TokenWithBalanceERC20 } from 'store/balance'
import { BN } from 'bn.js'
import { balanceToDisplayValue, bnToBig } from '@avalabs/utils-sdk'

export function convertErc20ToTokenWithBalance(
  tokenBalances: Erc20TokenBalance[]
): TokenWithBalanceERC20[] {
  return tokenBalances.map(
    (token: Erc20TokenBalance): TokenWithBalanceERC20 => {
      const balance = new BN(token.balance)
      const balanceDisplayValue = balanceToDisplayValue(balance, token.decimals)
      const balanceCurrencyDisplayValue =
        token.balanceValue?.value.toString() ?? '0'
      const priceInCurrency = token.price?.value ?? 0
      const balanceInCurrency = bnToBig(balance, token.decimals)
        .mul(priceInCurrency)
        .toNumber()

      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: token.logoUri,
        balance,
        balanceCurrencyDisplayValue,
        balanceDisplayValue,
        balanceInCurrency,
        priceInCurrency,
        contractType: 'ERC-20',
        type: TokenType.ERC20,
        change24: 0,
        marketCap: 0,
        vol24: 0
      }
    }
  )
}
