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
  fromTokenAddress?: string
  toTokenAddress?: string
  fromTokenDecimals?: number
  toTokenDecimals?: number
  amount: string
  swapSide: SwapSide
  account: Account
  network: Network
}) {
  const {
    fromTokenAddress,
    toTokenAddress,
    fromTokenDecimals,
    toTokenDecimals,
    amount,
    swapSide,
    account,
    network
  } = request || []

  if (!fromTokenAddress) {
    return {
      error: 'no source token on request'
    }
  }

  if (!toTokenAddress) {
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
      fromTokenAddress,
      fromTokenDecimals ?? 0,
      toTokenAddress,
      toTokenDecimals ?? 0,
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
