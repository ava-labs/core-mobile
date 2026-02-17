import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { LocalTokenWithBalance } from 'store/balance'
import Logger from 'utils/Logger'
import { NetworkWithCaip2ChainId } from 'store/network'
import FusionService from '../services/FusionService'
import { selectIsFusionServiceReady } from '../store/slice'
import { toSwappableAsset, toChain } from '../utils/fusionTypeConverters'
import { useBestQuote, useUserQuote, useAllQuotes } from './useZustandStore'

interface UseQuoteStreamingParams {
  fromToken: LocalTokenWithBalance | undefined
  fromNetwork: NetworkWithCaip2ChainId | undefined
  toToken: LocalTokenWithBalance | undefined
  toNetwork: NetworkWithCaip2ChainId | undefined
  fromAmount: bigint | undefined
  fromAddress: string | undefined
  toAddress: string | undefined
  slippageBps: number | undefined
}

interface UseQuoteStreamingResult {
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to stream real-time quotes from Fusion Service
 * Subscribes to the Fusion Service's quote stream and writes results to Zustand stores.
 */
export function useQuoteStreaming(
  params: UseQuoteStreamingParams
): UseQuoteStreamingResult {
  const {
    fromToken,
    fromNetwork,
    toToken,
    toNetwork,
    fromAmount,
    fromAddress,
    toAddress,
    slippageBps
  } = params

  // Subscribe to FusionService ready state
  const isFusionServiceReady = useSelector(selectIsFusionServiceReady)

  const [, setBestQuote] = useBestQuote()
  const [, setUserQuote] = useUserQuote()
  const [, setAllQuotes] = useAllQuotes()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Create Quoter instance when all required params are available
  const quoter = useMemo(() => {
    // First check if FusionService is ready
    if (!isFusionServiceReady) {
      return null
    }

    // Validate all required parameters
    if (
      !fromToken ||
      !fromNetwork ||
      !toToken ||
      !toNetwork ||
      !fromAmount ||
      fromAmount <= 0n ||
      !fromAddress ||
      !toAddress
    ) {
      return null
    }

    try {
      // Convert app types to SDK types
      const sourceAsset = toSwappableAsset(fromToken, fromNetwork)
      const targetAsset = toSwappableAsset(toToken, toNetwork)
      const sourceChain = toChain(fromNetwork)
      const targetChain = toChain(toNetwork)

      // Create quoter (service is guaranteed to be ready)
      return FusionService.getQuoter({
        fromAddress,
        toAddress,
        sourceAsset,
        sourceChain,
        targetAsset,
        targetChain,
        amount: fromAmount,
        slippageBps
      })
    } catch (err) {
      Logger.error('Failed to create Quoter instance', err)
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to create Quoter instance')
      )
      return null
    }
  }, [
    isFusionServiceReady,
    fromToken,
    fromNetwork,
    toToken,
    toNetwork,
    fromAmount,
    fromAddress,
    toAddress,
    slippageBps
  ])

  // Subscribe to quote stream
  useEffect(() => {
    // Clear quotes and reset state if quoter is invalid
    if (!quoter) {
      setBestQuote(null)
      setUserQuote(null)
      setAllQuotes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Subscribe to quote stream
    const unsubscribe = quoter.subscribe((event, data) => {
      if (event === 'quote') {
        // Write to Zustand stores
        setBestQuote(data.bestQuote)
        setAllQuotes([...data.quotes]) // Convert readonly array to mutable

        setIsLoading(false)
        setError(null)

        Logger.info('Quote update received', {
          bestQuote: data.bestQuote,
          quotesCount: data.quotes.length
        })
      } else if (event === 'error') {
        Logger.error('Quote stream error', data)
        setError(data)
        setIsLoading(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [quoter, setBestQuote, setUserQuote, setAllQuotes])

  return {
    isLoading,
    error
  }
}
