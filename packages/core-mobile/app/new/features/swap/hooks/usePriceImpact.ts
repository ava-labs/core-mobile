import { useEffect, useState } from 'react'
import { calculatePriceImpactFromQuote } from '@avalabs/fusion-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'

export type PriceImpactSeverity = 'low' | 'high' | 'critical'

export type PriceImpactAvailability =
  | 'hidden'
  | 'calculating'
  | 'unavailable'
  | 'ready'

const HIGH_IMPACT_THRESHOLD = 5
const CRITICAL_IMPACT_THRESHOLD = 50

type PriceImpactResult = {
  priceImpact: number | undefined
  priceImpactSeverity: PriceImpactSeverity
  priceImpactAvailability: PriceImpactAvailability
}

export function getPriceImpactSeverity(
  priceImpact: number | undefined
): PriceImpactSeverity {
  if (priceImpact === undefined || priceImpact < HIGH_IMPACT_THRESHOLD) {
    return 'low'
  }

  if (priceImpact >= CRITICAL_IMPACT_THRESHOLD) {
    return 'critical'
  }

  return 'high'
}

export function usePriceImpact(
  quote: Quote | null | undefined,
  fromToken: LocalTokenWithBalance | undefined,
  toToken: LocalTokenWithBalance | undefined
): PriceImpactResult {
  const [priceImpact, setPriceImpact] = useState<number | undefined>(undefined)
  const [priceImpactAvailability, setPriceImpactAvailability] =
    useState<PriceImpactAvailability>('hidden')

  const sourcePrice = fromToken?.priceInCurrency
  const targetPrice = toToken?.priceInCurrency

  useEffect(() => {
    if (!quote || !fromToken || !toToken) {
      setPriceImpact(undefined)
      setPriceImpactAvailability('hidden')
      return
    }

    if (!sourcePrice || !targetPrice) {
      setPriceImpact(undefined)
      setPriceImpactAvailability('unavailable')
      return
    }

    setPriceImpact(undefined)
    setPriceImpactAvailability('calculating')

    let cancelled = false

    const sourcePriceSnapshot = sourcePrice
    const targetPriceSnapshot = targetPrice

    calculatePriceImpactFromQuote(quote, async (input, output) => {
      if (cancelled) {
        return [0, 0]
      }

      const inputAmount = bigintToBig(
        input.amount,
        input.asset.decimals
      ).toNumber()
      const outputAmount = bigintToBig(
        output.amount,
        output.asset.decimals
      ).toNumber()

      return [
        inputAmount * sourcePriceSnapshot,
        outputAmount * targetPriceSnapshot
      ]
    })
      .then(bps => {
        if (cancelled) {
          return
        }

        if (bps === null) {
          setPriceImpact(undefined)
          setPriceImpactAvailability('unavailable')
        } else {
          // SDK returns basis points; convert to percentage and clamp favorable impact to 0
          setPriceImpact(Math.max(bps / 100, 0))
          setPriceImpactAvailability('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceImpact(undefined)
          setPriceImpactAvailability('unavailable')
        }
      })

    return () => {
      cancelled = true
    }
  }, [fromToken, quote, sourcePrice, targetPrice, toToken])

  return {
    priceImpact,
    priceImpactSeverity: getPriceImpactSeverity(priceImpact),
    priceImpactAvailability
  }
}
