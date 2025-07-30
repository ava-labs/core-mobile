import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RpcMethod } from '@avalabs/vm-module-types'
import { TransactionParams } from '@avalabs/evm-module'
import { humanizeParaswapRateError } from 'errors/swapError'
import {
  selectIsSwapFeesBlocked,
  selectIsSwapUseMarkrBlocked,
  selectMarkrGasMultiplier
} from 'store/posthog'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import {
  SwapProvider,
  NormalizedSwapQuoteResult,
  SwapProviders,
  SwapParams,
  GetEvmQuoteParams,
  EvmSwapQuote,
  PerformSwapEvmParams
} from '../types'
import { isWrappableToken } from '../utils/evm/isWrappableToken'
import { ParaswapProvider } from '../providers/ParaswapProvider'
import { MarkrProvider } from '../providers/MarkrProvider'
import { WNativeProvider } from '../providers/WNativeProvider'

export const useEvmSwap = (): {
  getQuote: (
    params: GetEvmQuoteParams
  ) => Promise<NormalizedSwapQuoteResult | undefined>
  swap: (params: SwapParams<EvmSwapQuote>) => Promise<string>
} => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const avalancheProvider = useAvalancheEvmProvider()
  const { request } = useInAppRequest()
  const isSwapFeesBlocked = useSelector(selectIsSwapFeesBlocked)
  const isSwapUseMarkrBlocked = useSelector(selectIsSwapUseMarkrBlocked)
  const markrGasMultiplier = useSelector(selectMarkrGasMultiplier)

  const getSwapProvider = (
    isMarkrBlocked: boolean
  ): SwapProvider<GetEvmQuoteParams, PerformSwapEvmParams> =>
    isMarkrBlocked ? ParaswapProvider : MarkrProvider

  const getSwapProviderByName = (
    name: SwapProviders
  ): SwapProvider<GetEvmQuoteParams, PerformSwapEvmParams> => {
    switch (name) {
      case SwapProviders.PARASWAP:
        return ParaswapProvider
      case SwapProviders.MARKR:
        return MarkrProvider
      case SwapProviders.WNATIVE:
        return WNativeProvider
      default:
        throw new Error(`Unsupported swap provider: ${name}`)
    }
  }

  const getQuote = useCallback(
    async (
      params: GetEvmQuoteParams
    ): Promise<NormalizedSwapQuoteResult | undefined> => {
      const {
        isFromTokenNative,
        fromTokenAddress,
        isToTokenNative,
        toTokenAddress
      } = params
      if (
        (isFromTokenNative && isWrappableToken(toTokenAddress)) ||
        (isToTokenNative && isWrappableToken(fromTokenAddress))
      ) {
        return WNativeProvider.getQuote(params)
      }

      // abort previous request
      abortControllerRef.current?.abort()
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const provider = getSwapProvider(isSwapUseMarkrBlocked)
        return await provider.getQuote(params, controller.signal)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.toLowerCase() === 'aborted') {
            return undefined
          }

          throw new Error(humanizeParaswapRateError(error.message))
        }
      } finally {
        // clean up controller
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [isSwapUseMarkrBlocked]
  )

  const swap = useCallback(
    ({
      account,
      network,
      fromTokenAddress,
      isFromTokenNative,
      toTokenAddress,
      isToTokenNative,
      swapProvider,
      quote,
      slippage
    }: SwapParams<EvmSwapQuote>) => {
      if (!avalancheProvider) {
        throw new Error('Invalid provider')
      }

      const signAndSend = (
        txParams: [TransactionParams],
        context?: Record<string, unknown>
      ): Promise<string> =>
        request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: txParams,
          chainId: getEvmCaip2ChainId(network.chainId),
          context
        })

      const provider = getSwapProviderByName(swapProvider)
      // getting the swap provider by name because there is chance that
      // the markr can be blocked after the quote is fetched
      return provider.swap({
        srcTokenAddress: fromTokenAddress,
        isSrcTokenNative: isFromTokenNative,
        destTokenAddress: toTokenAddress,
        isDestTokenNative: isToTokenNative,
        quote,
        slippage,
        network,
        provider: avalancheProvider,
        signAndSend,
        userAddress: account.addressC,
        isSwapFeesEnabled: !isSwapFeesBlocked,
        markrGasMultiplier
      })
    },
    [avalancheProvider, isSwapFeesBlocked, request, markrGasMultiplier]
  )

  return {
    getQuote,
    swap
  }
}
