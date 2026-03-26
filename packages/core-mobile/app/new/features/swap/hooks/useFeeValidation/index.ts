import { TokenType } from '@avalabs/vm-module-types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { LocalTokenWithBalance } from 'store/balance'
import { isSdkError } from '@avalabs/fusion-sdk'
import {
  selectFusionMaxAmountAdditiveBpsDefault,
  selectFusionMaxAmountAdditiveBpsEvmToSolana,
  selectFusionMaxAmountAdditiveBpsSolanaToEvm
} from 'store/posthog'
import { FusionQuoteError, fusionErrors } from '../../utils/fusionErrors'
import type { Quote } from '../../types'
import {
  getTotalAdditiveSourceFee,
  getTotalAdditiveNativeFee
} from '../../utils/getTotalAdditiveSourceFee'
import { useFeeEstimation } from '../useFeeEstimation'
import { getRouteAdditiveBps } from '../useMaxSwapAmount/utils'
import { validateNativeToken, validateNonNativeToken } from './utils'

export const useFeeValidation = ({
  fromToken,
  nativeTokenBalance,
  amount,
  quote
}: {
  fromToken: LocalTokenWithBalance | undefined
  nativeTokenBalance: bigint | undefined
  amount: bigint | undefined
  quote: Quote | null
}): {
  error: FusionQuoteError | undefined
  isValidating: boolean
  rawAdditiveFee: bigint
  bufferedAdditiveFee: bigint
  rawNativeAdditiveFee: bigint
  bufferedNativeAdditiveFee: bigint
  rawGasFee: bigint | undefined
  bufferedGasFee: bigint | undefined
  gasSafetyBps: number
  routeAdditiveBps: number
} => {
  const { getNetwork } = useNetworks()

  // Gas validation uses 0% buffer: live-quote gas already reflects real network
  // conditions and is typically much larger than the pre-quote estimate, so no
  // extra safety margin is needed.
  // Additive fee validation uses 10% less buffer than Max (base - 1000 bps):
  // bridge fees are stable enough that a small margin suffices, and this
  // ensures the Max amount always passes validation.
  const gasSafetyBps = 0
  const additiveBpsDefault =
    useSelector(selectFusionMaxAmountAdditiveBpsDefault) - 1000
  const additiveBpsEvmToSolana =
    useSelector(selectFusionMaxAmountAdditiveBpsEvmToSolana) - 1000
  const additiveBpsSolanaToEvm =
    useSelector(selectFusionMaxAmountAdditiveBpsSolanaToEvm) - 1000

  const isNative = fromToken?.type === TokenType.NATIVE

  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )

  const routeAdditiveBps = useMemo(
    () =>
      quote
        ? getRouteAdditiveBps(
            quote.sourceChain.chainId,
            quote.targetChain.chainId,
            {
              default: additiveBpsDefault,
              evmToSolana: additiveBpsEvmToSolana,
              solanaToEvm: additiveBpsSolanaToEvm
            }
          )
        : additiveBpsDefault,
    [quote, additiveBpsDefault, additiveBpsEvmToSolana, additiveBpsSolanaToEvm]
  )

  // Additive fees denominated in the source token (e.g. deBridge fee in USDC)
  const { buffered: bufferedAdditiveFee, raw: rawAdditiveFee } = useMemo(
    () => getTotalAdditiveSourceFee(fromToken, quote, routeAdditiveBps),
    [fromToken, quote, routeAdditiveBps]
  )

  // Additive fees denominated in the native asset (e.g. CCIP bridge fee in AVAX)
  // Only relevant for non-native source tokens
  const { buffered: bufferedNativeAdditiveFee, raw: rawNativeAdditiveFee } =
    useMemo(
      () => getTotalAdditiveNativeFee(fromToken, quote, routeAdditiveBps),
      [fromToken, quote, routeAdditiveBps]
    )

  const {
    gasFee: bufferedGasFee,
    rawGasFee,
    error,
    isFetching
  } = useFeeEstimation({ quote, fromNetwork, gasSafetyBps })

  const validationError = useMemo(() => {
    if (error && !isFetching) {
      const message = isSdkError(error)
        ? error.walk().message
        : error instanceof Error
        ? error.message
        : ''
      if (message.toLowerCase().includes('arithmetic underflow or overflow')) {
        return fusionErrors.swapAmountTooSmall()
      }
      return fusionErrors.gasEstimationFailed()
    }

    if (!fromToken || bufferedGasFee === undefined) return undefined

    if (isNative) {
      return validateNativeToken({
        fromToken,
        amount,
        bufferedGasFee,
        bufferedAdditiveFee
      })
    }

    return validateNonNativeToken({
      fromToken,
      fromNetwork,
      nativeTokenBalance,
      amount,
      bufferedGasFee,
      bufferedNativeAdditiveFee,
      bufferedAdditiveFee
    })
  }, [
    isNative,
    error,
    isFetching,
    fromToken,
    fromNetwork,
    nativeTokenBalance,
    amount,
    bufferedGasFee,
    bufferedAdditiveFee,
    bufferedNativeAdditiveFee
  ])

  return {
    error: validationError,
    isValidating: isFetching,
    rawAdditiveFee,
    bufferedAdditiveFee,
    rawNativeAdditiveFee,
    bufferedNativeAdditiveFee,
    rawGasFee,
    bufferedGasFee,
    gasSafetyBps,
    routeAdditiveBps
  }
}
