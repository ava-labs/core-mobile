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
  selectFusionMaxAmountAdditiveBpsDefault,
  selectFusionMaxAmountAdditiveBpsEvmToSolana,
  selectFusionMaxAmountAdditiveBpsSolanaToEvm
} from 'store/posthog'
import FusionService from '../../services/FusionService'
import { logSdkError } from '../../utils/fusionLogger'
import { toSwappableAsset, toChain } from '../../utils/fusionTypeConverters'
import type { Quote } from '../../types'
import type { QuoterParams } from '../../services/types'
import { useIsFusionServiceReady } from '../useZustandStore'
import { useFeeEstimation } from '../useFeeEstimation'
import { getTotalAdditiveSourceFee } from '../../utils/getTotalAdditiveSourceFee'
import { getTokenKey } from '../../utils/tokenKey'
import {
  computeMaxAmount,
  getPreQuoteAmount,
  getRouteAdditiveBps,
  resolveAdditiveFeeForMax
} from './utils'

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
 * Fetches a pre-quote to estimate fees before the user has entered any amount.
 */
type PreQuoteEntry = {
  quote: Quote
  fromId: string
  toId: string
} | null

const usePreQuote = ({
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

/**
 * Returns the maximum amount the user can swap from their balance.
 *
 * Fetches a pre-quote to estimate fees before the user has entered an amount.
 * All additive fees denominated in the source token (fundingModel === 'additive',
 * matching token type and address) are summed and buffered by a route-based
 * safety margin from feature flags.
 *
 * For native tokens, buffered gas is also subtracted.
 * For ERC20/SPL tokens, gas is paid in the native asset so only additive fees
 * in the source token are deducted.
 *
 * Returns undefined while the pre-quote or gas estimate is loading so the Max
 * button stays disabled until the correct value is known.
 */
export const useMaxSwapAmount = ({
  fromToken,
  toToken,
  minimumTransferAmount
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  minimumTransferAmount: bigint | null | undefined
}): {
  max: bigint | undefined
  rawAdditiveFee: bigint
  bufferedAdditiveFee: bigint
  routeAdditiveBps: number
  rawGasFee: bigint | undefined
  bufferedGasFee: bigint | undefined
  gasSafetyBps: number
} => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { getNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const maxAmountGasSafetyBps = useSelector(selectFusionMaxAmountGasSafetyBps)
  const additiveBpsDefault = useSelector(
    selectFusionMaxAmountAdditiveBpsDefault
  )
  const additiveBpsEvmToSolana = useSelector(
    selectFusionMaxAmountAdditiveBpsEvmToSolana
  )
  const additiveBpsSolanaToEvm = useSelector(
    selectFusionMaxAmountAdditiveBpsSolanaToEvm
  )

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

  const preQuoteAmount = useMemo(
    () => getPreQuoteAmount(minimumTransferAmount, fromToken),
    [minimumTransferAmount, fromToken]
  )

  const { quote: preQuote, failed: preQuoteFailed } = usePreQuote({
    isFusionServiceReady,
    fromToken,
    toToken,
    fromNetwork,
    toNetwork,
    fromAddress,
    toAddress,
    minimumTransferAmount: preQuoteAmount
  })

  const routeAdditiveBps = getRouteAdditiveBps(
    fromNetwork?.caip2ChainId,
    toNetwork?.caip2ChainId,
    {
      default: additiveBpsDefault,
      evmToSolana: additiveBpsEvmToSolana,
      solanaToEvm: additiveBpsSolanaToEvm
    }
  )

  // All additive fees in the source token, with a uniform route-based buffer.
  const additiveFeeResult = useMemo(
    () => getTotalAdditiveSourceFee(fromToken, preQuote, routeAdditiveBps),
    [fromToken, preQuote, routeAdditiveBps]
  )
  const bufferedAdditiveFee = additiveFeeResult.buffered
  const rawAdditiveFee = additiveFeeResult.raw

  const {
    gasFee: bufferedFee,
    rawGasFee,
    error: feeEstimationError,
    isFetching: isFeeEstimationFetching
  } = useFeeEstimation({
    quote: preQuote,
    fromNetwork,
    gasSafetyBps: maxAmountGasSafetyBps
  })

  const additiveFeeForMax = resolveAdditiveFeeForMax(
    preQuoteFailed,
    preQuote !== null,
    bufferedAdditiveFee
  )

  const max = useMemo(() => {
    return computeMaxAmount({
      fromToken,
      isNative,
      bufferedGas: bufferedFee,
      additiveFee: additiveFeeForMax,
      hasEstimationError:
        (!!feeEstimationError && !isFeeEstimationFetching) || preQuoteFailed
    })
  }, [
    fromToken,
    isNative,
    bufferedFee,
    additiveFeeForMax,
    feeEstimationError,
    preQuoteFailed,
    isFeeEstimationFetching
  ])

  return {
    max,
    rawAdditiveFee,
    bufferedAdditiveFee,
    routeAdditiveBps,
    rawGasFee,
    bufferedGasFee: bufferedFee,
    gasSafetyBps: maxAmountGasSafetyBps
  }
}
