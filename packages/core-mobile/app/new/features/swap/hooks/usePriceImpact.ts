import { useEffect, useState } from 'react'
import type { LocalTokenWithBalance } from 'store/balance'
import fusionService from '../services/FusionService'
import { type Quote, ServiceType } from '../types'
import { PriceImpactAvailability, PriceImpactSeverity } from '../consts'

const HIGH_IMPACT_THRESHOLD = 5
const CRITICAL_IMPACT_THRESHOLD = 50

type PriceImpactResult = {
  priceImpact: number | undefined
  priceImpactSeverity: PriceImpactSeverity
  priceImpactAvailability: PriceImpactAvailability
  isPriceImpactTooHigh: boolean
  isPriceImpactCalculating: boolean
}

export function getPriceImpactSeverity(
  priceImpact: number | undefined
): PriceImpactSeverity {
  if (priceImpact === undefined || priceImpact < HIGH_IMPACT_THRESHOLD) {
    return PriceImpactSeverity.Low
  }

  if (priceImpact >= CRITICAL_IMPACT_THRESHOLD) {
    return PriceImpactSeverity.Critical
  }

  return PriceImpactSeverity.High
}

export function usePriceImpact(
  quote: Quote | null | undefined,
  fromToken: LocalTokenWithBalance | undefined,
  toToken: LocalTokenWithBalance | undefined
): PriceImpactResult {
  const [priceImpact, setPriceImpact] = useState<number | undefined>(undefined)
  const [priceImpactAvailability, setPriceImpactAvailability] =
    useState<PriceImpactAvailability>(PriceImpactAvailability.Hidden)

  const sourcePrice = fromToken?.priceInCurrency
  const targetPrice = toToken?.priceInCurrency

  useEffect(() => {
    if (!quote || !fromToken || !toToken) {
      setPriceImpact(undefined)
      setPriceImpactAvailability(PriceImpactAvailability.Hidden)
      return
    }

    if (quote.serviceType !== ServiceType.MARKR) {
      setPriceImpact(undefined)
      setPriceImpactAvailability(PriceImpactAvailability.Hidden)
      return
    }

    if (!sourcePrice || !targetPrice) {
      setPriceImpact(undefined)
      setPriceImpactAvailability(PriceImpactAvailability.Unavailable)
      return
    }

    setPriceImpact(undefined)
    setPriceImpactAvailability(PriceImpactAvailability.Calculating)

    let cancelled = false

    const sourcePriceSnapshot = sourcePrice
    const targetPriceSnapshot = targetPrice

    fusionService
      .calculatePriceImpactFromQuote(
        quote,
        sourcePriceSnapshot,
        targetPriceSnapshot
      )
      .then(bps => {
        if (cancelled) {
          return
        }

        if (bps === null) {
          setPriceImpact(undefined)
          setPriceImpactAvailability(PriceImpactAvailability.Unavailable)
        } else {
          // SDK returns basis points; convert to percentage and clamp favorable impact to 0
          setPriceImpact(Math.max(bps / 100, 0))
          setPriceImpactAvailability(PriceImpactAvailability.Ready)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceImpact(undefined)
          setPriceImpactAvailability(PriceImpactAvailability.Unavailable)
        }
      })

    return () => {
      cancelled = true
    }
  }, [fromToken, quote, sourcePrice, targetPrice, toToken])

  const priceImpactSeverity = getPriceImpactSeverity(priceImpact)
  const isMarkrQuote = quote?.serviceType === ServiceType.MARKR

  return {
    priceImpact,
    priceImpactSeverity,
    priceImpactAvailability,
    isPriceImpactTooHigh:
      isMarkrQuote &&
      priceImpactAvailability === PriceImpactAvailability.Ready &&
      priceImpactSeverity === PriceImpactSeverity.Critical,
    isPriceImpactCalculating:
      isMarkrQuote &&
      priceImpactAvailability === PriceImpactAvailability.Calculating
  }
}
