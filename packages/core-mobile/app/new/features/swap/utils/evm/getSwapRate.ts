import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import { OptimalRate, SwapSide } from '@paraswap/sdk'
import ParaswapService from '../../services/ParaswapService'
import { MarkrQuote, SwapQuoteUpdate } from 'features/swap/types'
import { getSwapRateStream } from './getSwapRateStream'

export const getSwapRate = async ({
  fromTokenAddress,
  toTokenAddress,
  fromTokenDecimals,
  toTokenDecimals,
  amount,
  swapSide,
  account,
  network,
  abortSignal,
  isSwapUseMarkrBlocked,
  slippage,
  onUpdate
}: {
  fromTokenAddress?: string
  toTokenAddress?: string
  fromTokenDecimals?: number
  toTokenDecimals?: number
  amount: string
  swapSide: SwapSide
  account: Account
  network: Network
  abortSignal?: AbortSignal,
  isSwapUseMarkrBlocked: boolean,
  slippage: number,
  onUpdate?: (update: SwapQuoteUpdate) => void
}): Promise<{
  destAmount?: string
  optimalRate?: OptimalRate
  bestRate?: MarkrQuote
}> => {
  if (!fromTokenAddress || !fromTokenDecimals) {
    throw new Error('No source token selected')
  }

  if (!toTokenAddress || !toTokenDecimals) {
    throw new Error('No destination token selected')
  }

  if (!amount) {
    throw new Error('No amount')
  }

  if (isSwapUseMarkrBlocked) {
    const priceResponse = await ParaswapService.getSwapRate({
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
  }

  const priceResponse = await getSwapRateStream({
    fromTokenAddress,
    toTokenAddress,
    fromTokenDecimals,
    toTokenDecimals,
    amount,
    network,
    account,
    slippage,
    onUpdate: onUpdate!,
    abortSignal
  })

  if ('done' in priceResponse) {
    throw new Error('No rate found')
  }

  return {
    bestRate: priceResponse,
    destAmount: priceResponse.amountOut
  }
}
