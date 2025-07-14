import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RpcMethod } from '@avalabs/vm-module-types'
import { TransactionParams } from '@avalabs/evm-module'
import { humanizeParaswapRateError } from 'errors/swapError'
import { selectIsSwapFeesBlocked } from 'store/posthog'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { getSwapRate } from '../utils/evm/getSwapRate'
import {
  EvmSwapOperation,
  isEvmWrapQuote,
  isEvmUnwrapQuote,
  SwapParams,
  SwapQuote,
  GetEvmQuoteParams,
  EvmSwapQuote
} from '../types'
import { isWrappableToken } from '../utils/evm/isWrappableToken'
import { paraSwap } from '../utils/evm/paraSwap'
import { wrap } from '../utils/evm/wrap'
import { unwrap } from '../utils/evm/unwrap'

export const useEvmSwap = (): {
  getQuote: (params: GetEvmQuoteParams) => Promise<SwapQuote | undefined>
  swap: (params: SwapParams<EvmSwapQuote>) => Promise<string>
} => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const avalancheProvider = useAvalancheEvmProvider()
  const { request } = useInAppRequest()
  const isSwapFeesBlocked = useSelector(selectIsSwapFeesBlocked)

  const getQuote = useCallback(
    async ({
      address,
      amount,
      fromTokenAddress,
      fromTokenDecimals,
      isFromTokenNative,
      toTokenAddress,
      toTokenDecimals,
      isToTokenNative,
      destination,
      network
    }: GetEvmQuoteParams): Promise<SwapQuote | undefined> => {
      if (isFromTokenNative && isWrappableToken(toTokenAddress)) {
        return {
          operation: EvmSwapOperation.WRAP,
          target: toTokenAddress,
          amount: amount.toString()
        }
      } else if (isToTokenNative && isWrappableToken(fromTokenAddress)) {
        return {
          operation: EvmSwapOperation.UNWRAP,
          source: fromTokenAddress,
          amount: amount.toString()
        }
      }

      // abort previous request
      abortControllerRef.current?.abort()
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const { optimalRate } = await getSwapRate({
          fromTokenAddress,
          toTokenAddress,
          fromTokenDecimals,
          toTokenDecimals,
          amount,
          swapSide: destination,
          network,
          address,
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
      fromTokenAddress,
      isFromTokenNative,
      toTokenAddress,
      isToTokenNative,
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

      if (isEvmWrapQuote(quote)) {
        return wrap({
          userAddress: account.addressC,
          network,
          provider: avalancheProvider,
          quote,
          signAndSend
        })
      }

      if (isEvmUnwrapQuote(quote)) {
        return unwrap({
          userAddress: account.addressC,
          network,
          provider: avalancheProvider,
          quote,
          signAndSend
        })
      }

      return paraSwap({
        srcTokenAddress: fromTokenAddress,
        isSrcTokenNative: isFromTokenNative,
        destTokenAddress: toTokenAddress,
        isDestTokenNative: isToTokenNative,
        priceRoute: quote,
        slippage,
        network,
        provider: avalancheProvider,
        signAndSend,
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
