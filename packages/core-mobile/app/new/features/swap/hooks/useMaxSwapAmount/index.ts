import { TokenType } from '@avalabs/vm-module-types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  selectFusionMaxAmountGasSafetyBps,
  selectFusionMaxAmountAdditiveBpsDefault,
  selectFusionMaxAmountAdditiveBpsEvmToSolana,
  selectFusionMaxAmountAdditiveBpsSolanaToEvm
} from 'store/posthog'
import { useIsFusionServiceReady } from '../useZustandStore'
import { useFeeEstimation } from '../useFeeEstimation'
import {
  getTotalAdditiveSourceFee,
  getTotalAdditiveNativeFee
} from '../../utils/getTotalAdditiveSourceFee'
import { usePreQuote } from './usePreQuote'
import { useSpendableXpBalance } from './useSpendableXpBalance'
import {
  computeMaxAmount,
  getPreQuoteAmount,
  getRouteAdditiveBps,
  resolveAdditiveFeeForMax
} from './utils'

/**
 * Returns the maximum amount the user can swap from their balance.
 *
 * Fetches a pre-quote to estimate fees before the user has entered an amount.
 * All additive fees denominated in the source token (fundingModel === 'additive',
 * matching token type and address) are summed and buffered by a route-based
 * safety margin from feature flags.
 *
 * For native tokens, buffered gas is also subtracted.
 * For non-native tokens (ERC20/SPL), gas is paid in the native asset so only additive fees
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
  rawNativeAdditiveFee: bigint
  bufferedNativeAdditiveFee: bigint
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

  // Additive fees denominated in the native asset (e.g. CCIP bridge fee in AVAX)
  const nativeAdditiveFeeResult = useMemo(
    () => getTotalAdditiveNativeFee(fromToken, preQuote, routeAdditiveBps),
    [fromToken, preQuote, routeAdditiveBps]
  )
  const bufferedNativeAdditiveFee = nativeAdditiveFeeResult.buffered
  const rawNativeAdditiveFee = nativeAdditiveFeeResult.raw

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

  const { spendableBalance, isSpendableBalanceRequired } =
    useSpendableXpBalance({ fromToken, fromNetwork })

  const max = useMemo(() => {
    // CP-13903: a native X/P Max must come from the dust-filtered UTXO set
    // the CCT callbacks spend. Until it loads, keep Max disabled — falling
    // back to the displayed balance could build an over-spend.
    if (isSpendableBalanceRequired && spendableBalance === undefined) {
      return undefined
    }
    return computeMaxAmount({
      fromToken,
      isNative,
      bufferedGas: bufferedFee,
      additiveFee: additiveFeeForMax,
      hasEstimationError:
        (!!feeEstimationError && !isFeeEstimationFetching) || preQuoteFailed,
      spendableBalance: isSpendableBalanceRequired
        ? spendableBalance
        : undefined
    })
  }, [
    fromToken,
    isNative,
    bufferedFee,
    additiveFeeForMax,
    feeEstimationError,
    preQuoteFailed,
    isFeeEstimationFetching,
    isSpendableBalanceRequired,
    spendableBalance
  ])

  return {
    max,
    rawAdditiveFee,
    bufferedAdditiveFee,
    routeAdditiveBps,
    rawGasFee,
    bufferedGasFee: bufferedFee,
    gasSafetyBps: maxAmountGasSafetyBps,
    rawNativeAdditiveFee,
    bufferedNativeAdditiveFee
  }
}
