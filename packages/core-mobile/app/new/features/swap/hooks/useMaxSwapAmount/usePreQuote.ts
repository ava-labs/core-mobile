import { useState, useEffect } from 'react'
import type { LocalTokenWithBalance } from 'store/balance'
import { NetworkWithCaip2ChainId } from 'store/network'
import { toSwappableAsset, toChain } from '../../utils/fusionTypeConverters'
import { subscribeToFirstQuote } from '../../utils/subscribeToFirstQuote'
import type { Quote } from '../../types'
import { getTokenKey } from '../../utils/tokenKey'

type PreQuoteEntry = {
  quote: Quote
  fromId: string
  toId: string
} | null

/**
 * Fetches a pre-quote to estimate fees before the user has entered any amount.
 */
export const usePreQuote = ({
  isFusionServiceReady,
  fromToken,
  toToken,
  fromNetwork,
  toNetwork,
  fromAddress,
  toAddress,
  minimumTransferAmount
}: {
  isFusionServiceReady: boolean
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  fromNetwork: NetworkWithCaip2ChainId | undefined
  toNetwork: NetworkWithCaip2ChainId | undefined
  fromAddress: string | undefined
  toAddress: string | undefined
  minimumTransferAmount: bigint | null | undefined
}): { quote: Quote | null; failed: boolean } => {
  const [preQuoteEntry, setPreQuoteEntry] = useState<PreQuoteEntry>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const prerequisitesMet =
      isFusionServiceReady &&
      !!fromToken &&
      !!toToken &&
      !!fromNetwork &&
      !!toNetwork &&
      !!fromAddress &&
      !!toAddress

    // minimumTransferAmount === undefined means still loading — wait
    if (!prerequisitesMet || minimumTransferAmount === undefined) {
      setPreQuoteEntry(null)
      setFailed(false)
      return
    }

    // null means the SDK couldn't provide a minimum; <= 0n would be unusable — treat both as failure
    if (minimumTransferAmount === null || minimumTransferAmount <= 0n) {
      setPreQuoteEntry(null)
      setFailed(true)
      return
    }

    const fromId = getTokenKey(fromToken)
    const toId = getTokenKey(toToken)

    const cleanup = subscribeToFirstQuote(
      {
        fromAddress,
        toAddress,
        sourceAsset: toSwappableAsset(fromToken),
        sourceChain: toChain(fromNetwork),
        targetAsset: toSwappableAsset(toToken),
        targetChain: toChain(toNetwork),
        amount: minimumTransferAmount
      },
      quote => {
        setFailed(false)
        setPreQuoteEntry({ quote, fromId, toId })
      },
      () => {
        setPreQuoteEntry(null)
        setFailed(true)
      }
    )

    if (!cleanup) {
      setPreQuoteEntry(null)
      setFailed(true)
    }

    return cleanup
  }, [
    isFusionServiceReady,
    fromToken,
    toToken,
    fromNetwork,
    toNetwork,
    fromAddress,
    toAddress,
    minimumTransferAmount
  ])

  // Derive quote synchronously in render: return null when the stored entry
  // belongs to a different token pair
  const isCurrentPair =
    preQuoteEntry?.fromId ===
      (fromToken ? getTokenKey(fromToken) : undefined) &&
    preQuoteEntry?.toId === (toToken ? getTokenKey(toToken) : undefined)

  return {
    quote: isCurrentPair ? preQuoteEntry?.quote ?? null : null,
    failed: isCurrentPair ? failed : false
  }
}
