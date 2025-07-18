import { Network } from '@avalabs/core-chains-sdk'
import { SwapSide } from '@paraswap/sdk'
import { SOL_MINT } from 'features/swap/consts'
import Logger from 'utils/Logger'
import { JupiterQuote } from '../utils/svm/schemas'
import { jupiterApi } from '../utils/svm/jupiterApi.client'

class JupiterService {
  async getSwapRate({
    fromTokenAddress,
    fromTokenDecimals,
    toTokenAddress,
    toTokenDecimals,
    fromTokenBalance,
    amount,
    swapSide,
    network,
    abortSignal,
    slippage,
    platformFeeBps
  }: {
    fromTokenAddress?: string
    fromTokenDecimals?: number
    toTokenAddress?: string
    toTokenDecimals?: number
    fromTokenBalance?: bigint
    amount: bigint
    swapSide: SwapSide
    network: Network
    abortSignal?: AbortSignal
    slippage: number
    platformFeeBps?: number
  }): Promise<{
    destAmount: string
    quote: JupiterQuote
  }> {
    if (!fromTokenAddress || !fromTokenDecimals) {
      throw new Error('No source token selected')
    }

    if (!toTokenAddress || !toTokenDecimals) {
      throw new Error('No destination token selected')
    }

    if (!amount) {
      throw new Error('No amount')
    }

    const isSelling = swapSide === SwapSide.SELL
    const inputMint =
      fromTokenAddress === network.networkToken.symbol
        ? SOL_MINT
        : fromTokenAddress
    const outputMint =
      toTokenAddress === network.networkToken.symbol ? SOL_MINT : toTokenAddress
    const swapMode = isSelling ? 'ExactIn' : 'ExactOut'

    // In the UI, slippage is provided as %. We need to convert it into basis points for Jupiter:
    const slippageBps = slippage * 100

    if (Number.isNaN(slippageBps)) {
      throw new Error('Invalid slippage tolerance')
    }

    try {
      const data = await jupiterApi.getQuote({
        queries: {
          inputMint,
          outputMint,
          swapMode,
          amount: amount.toString(),
          slippageBps: Math.round(slippageBps).toString(),
          platformFeeBps: platformFeeBps?.toString()
        },
        signal: abortSignal
      })

      if (
        typeof fromTokenBalance === 'bigint' &&
        fromTokenBalance < BigInt(data.inAmount)
      ) {
        throw new Error('Insufficient balance')
      }

      return {
        quote: data,
        destAmount: isSelling ? data.outAmount : data.inAmount
      }
    } catch (error) {
      Logger.error('Unable to get swap quote from Jupiter', error)
      throw new Error('Failed to fetch the swap quote')
    }
  }
}

export default new JupiterService()
