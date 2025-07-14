import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectIsSwapFeesJupiterBlocked } from 'store/posthog'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { GetSolanaQuoteParams, SwapParams, SwapQuote } from '../types'
import { getSwapRate } from '../utils/svm/getSwapRate'
import { JUPITER_PARTNER_FEE_BPS } from '../consts'
import { JupiterQuote } from '../utils/svm/schemas'
import { svmSwap } from '../utils/svm/swap'

export const useSolanaSwap = (): {
  getQuote: (params: GetSolanaQuoteParams) => Promise<SwapQuote | undefined>
  swap: (params: SwapParams<JupiterQuote>) => Promise<string>
} => {
  const isSwapFeesJupiterBlocked = useSelector(selectIsSwapFeesJupiterBlocked)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { request } = useInAppRequest()

  const getQuote = useCallback(
    async ({
      amount,
      fromTokenAddress,
      fromTokenDecimals,
      fromTokenBalance,
      toTokenAddress,
      toTokenDecimals,
      destination,
      network,
      slippage
    }: GetSolanaQuoteParams): Promise<SwapQuote | undefined> => {
      // abort previous request
      abortControllerRef.current?.abort()
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const { quote } = await getSwapRate({
          fromTokenAddress,
          fromTokenDecimals,
          fromTokenBalance,
          toTokenAddress,
          toTokenDecimals,
          amount,
          swapSide: destination,
          network,
          abortSignal: controller.signal,
          slippage,
          platformFeeBps: isSwapFeesJupiterBlocked
            ? undefined
            : JUPITER_PARTNER_FEE_BPS
        })
        return quote
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Aborted') {
            return undefined
          }

          throw new Error(error.message)
        }
      } finally {
        // clean up controller
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
      }
    },
    [isSwapFeesJupiterBlocked]
  )

  const swap = useCallback(
    async ({
      account,
      network,
      quote,
      fromTokenAddress,
      toTokenAddress,
      slippage
    }: SwapParams<JupiterQuote>) => {
      const signAndSend = (
        txParams: {
          account: string
          serializedTx: string
        }[],
        context?: Record<string, unknown>
      ): Promise<string> =>
        request({
          method: RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          params: txParams,
          chainId: getSolanaCaip2ChainId(network.chainId),
          context
        })

      return svmSwap({
        network,
        userAddress: account.addressSVM,
        fromTokenAddress,
        toTokenAddress,
        quote,
        slippage,
        signAndSend,
        isSwapFeesJupiterBlocked
      })
    },
    [request, isSwapFeesJupiterBlocked]
  )

  return {
    getQuote,
    swap
  }
}
