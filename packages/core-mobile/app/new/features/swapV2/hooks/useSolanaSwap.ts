import { useCallback } from 'react'
import {
  GetSvmQuoteParams,
  NormalizedSwapQuoteResult,
  SwapParams,
  SwapProviders,
  JupiterQuote
} from '../types'
import { MOCK_QUOTE } from '../mockData'

export const useSolanaSwap = (): {
  getQuote: (
    params: GetSvmQuoteParams
  ) => Promise<NormalizedSwapQuoteResult | undefined>
  swap: (params: SwapParams<JupiterQuote>) => Promise<string>
} => {
  const getQuote = useCallback(async (params: GetSvmQuoteParams) => {
    // eslint-disable-next-line no-console
    console.log('useSolanaSwap.getQuote stub called', params)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Return mock quote with Jupiter provider
    return {
      ...MOCK_QUOTE,
      provider: SwapProviders.JUPITER
    }
  }, [])

  const swap = useCallback(async (params: SwapParams<JupiterQuote>) => {
    // eslint-disable-next-line no-console
    console.log('useSolanaSwap.swap stub called', params)

    // Return mock Solana transaction signature
    return '5J7X...' // Mock signature
  }, [])

  return { getQuote, swap }
}
