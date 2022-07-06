import { SwapSide } from 'paraswap'
import { OptimalRate } from 'paraswap-core'
import { Network } from '@avalabs/chains-sdk'
import { TokenType, TokenWithBalance } from 'store/balance'
import { Account } from 'store/account'
import { resolve } from '@avalabs/utils-sdk'
import swapService from 'services/swap/SwapService'

export const getTokenAddress = (token?: TokenWithBalance) => {
  if (!token) {
    return ''
  }
  return token.type === TokenType.NATIVE ? token.symbol : token.address
}

export async function getSwapRate(request: {
  srcToken: TokenWithBalance
  destToken: TokenWithBalance
  amount: string
  swapSide: SwapSide
  account: Account
  network: Network
}) {
  const { srcToken, destToken, amount, swapSide, account, network } =
    request || []

  if (!srcToken) {
    return {
      error: 'no source token on request'
    }
  }

  if (!destToken) {
    return {
      error: 'no destination token on request'
    }
  }

  if (!amount) {
    return {
      error: 'no amount on request'
    }
  }

  const [result, error] = await resolve(
    swapService.getSwapRate(
      getTokenAddress(srcToken),
      srcToken.decimals,
      getTokenAddress(destToken),
      destToken.decimals,
      amount,
      swapSide,
      network,
      account
    )
  )

  if (error) {
    return {
      error: (error as any).toString()
    }
  }

  const destAmount = result.destAmount

  return {
    optimalRate: result as OptimalRate,
    destAmount
  }
}
