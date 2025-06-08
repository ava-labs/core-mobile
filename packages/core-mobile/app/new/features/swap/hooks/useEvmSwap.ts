import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RpcMethod } from '@avalabs/vm-module-types'
import { humanizeParaswapRateError } from 'errors/swapError'
import { selectIsSwapFeesBlocked } from 'store/posthog'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { getSwapRate } from '../utils/evm/getSwapRate'
import { getTokenAddress } from '../utils/getTokenAddress'
import {
  GetQuoteParams,
  isUnwrapOperation,
  isWrapOperation,
  SwapParams,
  SwapQuote
} from '../types'
import { performSwap } from '../utils/evm/performSwap'

export const useEvmSwap = (): {
  getQuote: (params: GetQuoteParams) => Promise<SwapQuote | undefined>
  swap: (params: SwapParams) => Promise<string>
} => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const avalancheProvider = useAvalancheEvmProvider()
  const { request } = useInAppRequest()
  const isSwapFeesBlocked = useSelector(selectIsSwapFeesBlocked)

  const getQuote = useCallback(
    async ({
      account,
      amount,
      fromToken,
      toToken,
      destination,
      network
    }: GetQuoteParams): Promise<SwapQuote | undefined> => {
      // validate tokens
      if (!fromToken || !('decimals' in fromToken)) {
        throw new Error('Invalid from token')
      }
      if (!toToken || !('decimals' in toToken)) {
        throw new Error('Invalid to token')
      }

      // abort previous request
      abortControllerRef.current?.abort()
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const { optimalRate } = await getSwapRate({
          fromTokenAddress: getTokenAddress(fromToken),
          toTokenAddress: getTokenAddress(toToken),
          fromTokenDecimals: fromToken.decimals,
          toTokenDecimals: toToken.decimals,
          amount: amount.toString(),
          swapSide: destination,
          network,
          account,
          abortSignal: controller.signal
        })
        return optimalRate
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Aborted') {
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
    []
  )

  const swap = useCallback(
    ({
      account,
      network,
      srcTokenAddress,
      isSrcTokenNative,
      destTokenAddress,
      isDestTokenNative,
      quote,
      slippage
    }: SwapParams) => {
      if (!avalancheProvider) {
        throw new Error('Invalid provider')
      }

      if (isWrapOperation(quote) || isUnwrapOperation(quote)) {
        throw new Error('Invalid quote')
      }

      return performSwap({
        srcTokenAddress,
        isSrcTokenNative,
        destTokenAddress,
        isDestTokenNative,
        priceRoute: quote,
        slippage,
        network,
        provider: avalancheProvider,
        signAndSend: (txParams, context) =>
          request({
            method: RpcMethod.ETH_SEND_TRANSACTION,
            params: txParams,
            chainId: getEvmCaip2ChainId(network.chainId),
            context
          }),
        userAddress: account.addressC,
        isSwapFeesEnabled: !isSwapFeesBlocked
      })
    },
    [avalancheProvider, isSwapFeesBlocked, request]
  )

  return {
    getQuote,
    swap
  }
}
