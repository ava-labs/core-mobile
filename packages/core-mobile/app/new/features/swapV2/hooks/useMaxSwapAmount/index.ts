import { skipToken, useQuery } from '@tanstack/react-query'
import { TokenType } from '@avalabs/vm-module-types'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import type { LocalTokenWithBalance } from 'store/balance'
import { NetworkWithCaip2ChainId } from 'store/network'
import {
  selectFusionFeeUnitsMarginBps,
  selectFusionMaxAmountGasSafetyBps,
  selectFusionBridgeFeeSafetyBps
} from 'store/posthog'
import FusionService from '../../services/FusionService'
import { logSdkError } from '../../utils/fusionLogger'
import { toSwappableAsset, toChain } from '../../utils/fusionTypeConverters'
import type { Quote } from '../../types'
import type { QuoterParams } from '../../services/types'
import { useIsFusionServiceReady } from '../useZustandStore'
import { buildFeeOptions, computeMaxAmount, getNativeBridgeFee } from './utils'

/**
 * Subscribes to the first quote emitted by a Quoter for the given params,
 * calls onQuote with it, then unsubscribes. Returns a cleanup function or
 * undefined if the quoter could not be created.
 */
const subscribeToFirstQuote = (
  params: QuoterParams,
  onQuote: (quote: Quote) => void
): (() => void) | undefined => {
  try {
    const quoter = FusionService.getQuoter(params)
    if (!quoter) return undefined

    let unsubscribed = false
    const unsubscribe = quoter.subscribe((event, data) => {
      if (event === 'quote' && !unsubscribed) {
        onQuote(data.bestQuote)
        unsubscribe()
      }
    })
    return () => {
      unsubscribed = true
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
  minimumTransferAmount: bigint | null
}): Quote | null => {
  const [dummyQuote, setDummyQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (
      !isNative ||
      !isFusionServiceReady ||
      !fromToken ||
      !toToken ||
      !fromNetwork ||
      !toNetwork ||
      !fromAddress ||
      !toAddress ||
      !minimumTransferAmount
    ) {
      setDummyQuote(null)
      return
    }

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
      setDummyQuote
    )

    if (!cleanup) setDummyQuote(null)

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

  return dummyQuote
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
  minimumTransferAmount: bigint | null
}): bigint | undefined => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { getNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const feeUnitsMarginBps = useSelector(selectFusionFeeUnitsMarginBps)
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

  const { data: networkFee } = useNetworkFee(fromNetwork)

  const feeOptions = useMemo(
    () => buildFeeOptions(feeUnitsMarginBps, networkFee),
    [feeUnitsMarginBps, networkFee]
  )

  const dummyQuote = useDummyQuote({
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

  const { data: bufferedFee, error } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.FUSION_MAX_SWAP_FEE_ESTIMATE, dummyQuote?.id],
    queryFn: dummyQuote
      ? async () => {
          const { totalFee } = await FusionService.estimateNativeFee(
            dummyQuote,
            feeOptions
          )
          return (totalFee * (10000n + BigInt(maxAmountGasSafetyBps))) / 10000n
        }
      : skipToken,
    staleTime: 0,
    retry: false
  })

  useEffect(() => {
    if (error) logSdkError('[useMaxSwapAmount] estimateNativeFee error', error)
  }, [error])

  return useMemo(
    () =>
      computeMaxAmount({
        fromToken,
        isNative,
        bufferedGas: bufferedFee,
        bridgeFee,
        hasEstimationError: !!error
      }),
    [fromToken, isNative, bufferedFee, bridgeFee, error]
  )
}
