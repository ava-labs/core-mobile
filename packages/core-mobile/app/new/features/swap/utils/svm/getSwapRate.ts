import { Network } from '@avalabs/core-chains-sdk'
import { SwapSide } from '@paraswap/sdk'
import { SOL_MINT } from 'features/swap/consts'
import { fetchAndVerify } from 'utils/fetchAndVerify'
import Logger from 'utils/Logger'
import { URLSearchParams } from 'react-native-url-polyfill'
import { JUPITER_QUOTE_SCHEMA, JupiterQuote } from './schemas'
import { getUrl } from './getUrl'

export const getSwapRate = async ({
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

  const feeParams = platformFeeBps
    ? { platformFeeBps: platformFeeBps.toString() }
    : undefined

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    swapMode,
    amount: amount.toString(),
    slippageBps: Math.round(slippageBps).toString(),
    ...feeParams
  })

  try {
    const data = await fetchAndVerify(
      [
        getUrl('quote', params),
        {
          signal: abortSignal
        }
      ],
      JUPITER_QUOTE_SCHEMA
    ).catch(error => {
      Logger.error('Unable to get swap quote from Jupiter', error)
      throw new Error('Failed to fetch the swap quote')
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
