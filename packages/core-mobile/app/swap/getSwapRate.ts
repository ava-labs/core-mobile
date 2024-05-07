import { APIError, SwapSide } from 'paraswap'
import { Network } from '@avalabs/chains-sdk'
import { TokenType, TokenWithBalance } from 'store/balance'
import { Account } from 'store/account'
import { resolve } from '@avalabs/utils-sdk'
import swapService from 'services/swap/SwapService'
import { OptimalRate } from 'paraswap-core'

export const getTokenAddress = (token?: TokenWithBalance): string => {
  if (!token) {
    return ''
  }
  return token.type === TokenType.NATIVE ? token.symbol : token.address
}

export async function getSwapRate({
  fromTokenAddress,
  toTokenAddress,
  fromTokenDecimals,
  toTokenDecimals,
  amount,
  swapSide,
  account,
  network
}: {
  fromTokenAddress?: string
  toTokenAddress?: string
  fromTokenDecimals?: number
  toTokenDecimals?: number
  amount: string
  swapSide: SwapSide
  account: Account
  network: Network
}): Promise<{
  destAmount?: string
  optimalRate?: OptimalRate
  error?: string
}> {
  if (!fromTokenAddress || !fromTokenDecimals) {
    return {
      error: 'no source token selected'
    }
  }

  if (!toTokenAddress || !toTokenDecimals) {
    return {
      error: 'no destination token selected'
    }
  }

  if (!amount) {
    return {
      error: 'no amount'
    }
  }

  const [priceResponse, error] = await resolve(
    swapService.getSwapRate({
      srcToken: fromTokenAddress,
      srcDecimals: fromTokenDecimals,
      destToken: toTokenAddress,
      destDecimals: toTokenDecimals,
      srcAmount: amount,
      swapSide: swapSide,
      network: network,
      account: account
    })
  )

  if (error) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error as any).toString()
    }
  }

  if (!priceResponse) {
    return {
      error: 'no price response'
    }
  }

  if ((priceResponse as APIError).message) {
    return { error: (priceResponse as APIError).message }
  }

  return {
    optimalRate: priceResponse as OptimalRate,
    destAmount: (priceResponse as OptimalRate).destAmount
  }
}
