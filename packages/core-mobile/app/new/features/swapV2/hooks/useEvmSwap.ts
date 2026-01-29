import { useCallback } from 'react'
import {
  NormalizedSwapQuoteResult,
  GetEvmQuoteParams,
  PerformSwapEvmParams
} from '../types'
import { MOCK_QUOTE } from '../mockData'

export const useEvmSwap = (): {
  getQuote: (params: GetEvmQuoteParams) => Promise<NormalizedSwapQuoteResult>
  swap: (params: PerformSwapEvmParams) => Promise<string>
} => {
  const getQuote = useCallback(async (params: GetEvmQuoteParams) => {
    // eslint-disable-next-line no-console
    console.log('useEvmSwap.getQuote stub called', params)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Return mock quote
    return MOCK_QUOTE
  }, [])

  const swap = useCallback(async (params: PerformSwapEvmParams) => {
    // eslint-disable-next-line no-console
    console.log('useEvmSwap.swap stub called', params)

    // Return mock transaction hash
    return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }, [])

  return { getQuote, swap }
}
