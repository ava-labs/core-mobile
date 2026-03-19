import { TokenType } from '@avalabs/vm-module-types'
import { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import { NetworkWithCaip2ChainId } from 'store/network'
import {
  selectFusionMaxAmountGasSafetyBps,
  selectFusionBridgeFeeSafetyBps
} from 'store/posthog'
import FusionService from '../../services/FusionService'
import { logSdkError } from '../../utils/fusionLogger'
import { toSwappableAsset, toChain } from '../../utils/fusionTypeConverters'
import type { Quote } from '../../types'
import type { QuoterParams } from '../../services/types'
import { useIsFusionServiceReady } from '../useZustandStore'
import { useFeeEstimation } from '../useFeeEstimation'
import { getNativeBridgeFee } from '../../utils/bridgeFee'
import { getTokenKey } from '../../utils/tokenKey'
import { computeMaxAmount } from './utils'

/**
 * Subscribes to the first quote emitted by a Quoter for the given params,
 * calls onQuote with it, then unsubscribes. Returns a cleanup function or
 * undefined if the quoter could not be created.
 */
const subscribeToFirstQuote = (
  params: QuoterParams,
  onQuote: (quote: Quote) => void,
  onFailed: () => void
): (() => void) | undefined => {
  try {
    const quoter = FusionService.getQuoter(params)
    if (!quoter) return undefined

    let settled = false
    const unsubscribe = quoter.subscribe((event, data) => {
      if (settled) return
      if (event === 'quote') {
        settled = true
        onQuote(data.bestQuote)
        unsubscribe()
      } else if (event === 'done' || event === 'error') {
        settled = true
        onFailed()
        unsubscribe()
      }
    })
    return () => {
      settled = true
      unsubscribe()
    }
  } catch (error) {
    logSdkError('[subscribeToFirstQuote] error', error)
    return undefined
  }
}

/**
 * Fetches a single dummy quote using minimumTransferAmount to estimate fees
 * before the user has entered any amount. Only active for native tokens.
 *
 * The bridge fee in quote.fees is a flat fee independent of amount, so using
 * minimumTransferAmount produces the same bridge fee as the full balance.
 */
type DummyQuoteEntry = {
  quote: Quote
  fromId: string
  toId: string
} | null

const useDummyQuote = ({
  isNative,
  isFusionServiceReady,
  fromToken,
  toToken,
  fromNetwork,
  toNetwork,
  fromAddress,
  toAddress,
  minimumTransferAmount
}: {
  isNative: boolean
  isFusionServiceReady: boolean
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  fromNetwork: NetworkWithCaip2ChainId | undefined
  toNetwork: NetworkWithCaip2ChainId | undefined
  fromAddress: string | undefined
  toAddress: string | undefined
  minimumTransferAmount: bigint | null | undefined
}): { quote: Quote | null; failed: boolean } => {
  const [dummyQuoteEntry, setDummyQuoteEntry] = useState<DummyQuoteEntry>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const prerequisitesMet =
      isNative &&
      isFusionServiceReady &&
      !!fromToken &&
      !!toToken &&
      !!fromNetwork &&
      !!toNetwork &&
      !!fromAddress &&
      !!toAddress

    // minimumTransferAmount === undefined means still loading — wait
    if (!prerequisitesMet || minimumTransferAmount === undefined) {
      setDummyQuoteEntry(null)
      setFailed(false)
      return
    }

    // null means the SDK couldn't provide a minimum; <= 0n would be unusable — treat both as failure
    if (minimumTransferAmount === null || minimumTransferAmount <= 0n) {
      setDummyQuoteEntry(null)
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
        setDummyQuoteEntry({ quote, fromId, toId })
      },
      () => {
        setDummyQuoteEntry(null)
        setFailed(true)
      }
    )

    if (!cleanup) {
      setDummyQuoteEntry(null)
      setFailed(true)
    }

    return cleanup
  }, [
    isNative,
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
    dummyQuoteEntry?.fromId ===
      (fromToken ? getTokenKey(fromToken) : undefined) &&
    dummyQuoteEntry?.toId === (toToken ? getTokenKey(toToken) : undefined)

  return {
    quote: isCurrentPair ? dummyQuoteEntry?.quote ?? null : null,
    failed: isCurrentPair ? failed : false
  }
}

/**
 * Returns the maximum amount the user can swap from their balance.
 *
 * For native tokens, the following fees are estimated upfront using a dummy quote at the
 * minimum transfer amount and subtracted from the balance:
 * - Gas: estimated via estimateNativeFee with a safety buffer from feature flags
 * - Bridge fee: extracted from quote.fees (a calculation sum of the blockchain fee + network fee, independent of swap amount)
 *
 * Returns undefined while the estimate is loading so the Max button stays
 * disabled until the correct value is known.
 *
 * For non-native tokens, the full balance is returned immediately since gas is
 * paid in the chain's native asset.
 */
export const useMaxSwapAmount = ({
  fromToken,
  toToken,
  minimumTransferAmount
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  minimumTransferAmount: bigint | null | undefined
}): bigint | undefined => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { getNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const maxAmountGasSafetyBps = useSelector(selectFusionMaxAmountGasSafetyBps)
  const bridgeFeeSafetyBps = useSelector(selectFusionBridgeFeeSafetyBps)

  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )
  const toNetwork = useMemo(
    () => (toToken ? getNetwork(toToken.networkChainId) : undefined),
    [toToken, getNetwork]
  )
  const fromAddress = useMemo(
    () =>
      activeAccount && fromNetwork
        ? getAddressByNetwork(activeAccount, fromNetwork)
        : undefined,
    [activeAccount, fromNetwork]
  )
  const toAddress = useMemo(
    () =>
      activeAccount && toNetwork
        ? getAddressByNetwork(activeAccount, toNetwork)
        : undefined,
    [activeAccount, toNetwork]
  )

  const isNative = fromToken?.type === TokenType.NATIVE

  const { quote: dummyQuote, failed: dummyQuoteFailed } = useDummyQuote({
    isNative,
    isFusionServiceReady,
    fromToken,
    toToken,
    fromNetwork,
    toNetwork,
    fromAddress,
    toAddress,
    minimumTransferAmount
  })

  // Bridge fee on the source chain (independent of swap amount).
  // Extracted separately from quote.fees because estimateNativeFee only returns gas.
  const bridgeFee = useMemo(
    () => getNativeBridgeFee(isNative, dummyQuote, bridgeFeeSafetyBps),
    [isNative, dummyQuote, bridgeFeeSafetyBps]
  )

  const {
    gasFee: bufferedFee,
    error: feeEstimationError,
    isFetching: isFeeEstimationFetching
  } = useFeeEstimation({
    quote: dummyQuote,
    fromNetwork,
    gasSafetyBps: maxAmountGasSafetyBps
  })

  return useMemo(
    () =>
      computeMaxAmount({
        fromToken,
        isNative,
        bufferedGas: bufferedFee,
        bridgeFee,
        hasEstimationError:
          (!!feeEstimationError && !isFeeEstimationFetching) || dummyQuoteFailed
      }),
    [
      fromToken,
      isNative,
      bufferedFee,
      bridgeFee,
      feeEstimationError,
      dummyQuoteFailed,
      isFeeEstimationFetching
    ]
  )
}
