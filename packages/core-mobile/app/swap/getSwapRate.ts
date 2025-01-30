import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import SwapService from 'services/swap/SwapService'
import { OptimalRate, SwapSide } from '@paraswap/sdk'
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'

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
  network,
  abortSignal
}: {
  fromTokenAddress?: string
  toTokenAddress?: string
  fromTokenDecimals?: number
  toTokenDecimals?: number
  amount: string
  swapSide: SwapSide
  account: Account
  network: Network
  abortSignal?: AbortSignal
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

  try {
    const priceResponse = await SwapService.getSwapRate({
      srcToken: fromTokenAddress,
      srcDecimals: fromTokenDecimals,
      destToken: toTokenAddress,
      destDecimals: toTokenDecimals,
      srcAmount: amount,
      swapSide: swapSide,
      network: network,
      account: account,
      abortSignal
    })
    return {
      optimalRate: priceResponse,
      destAmount: priceResponse.destAmount
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'unknown error'
    }
  }
}
