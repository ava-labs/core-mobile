import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectIsSwapFeesJupiterBlocked } from 'store/posthog'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import {
  GetSvmQuoteParams,
  NormalizedSwapQuoteResult,
  SvmTransactionParams,
  SwapParams
} from '../types'
import { JUPITER_PARTNER_FEE_BPS } from '../consts'
import { JupiterQuote } from '../utils/svm/schemas'
import { JupiterProvider } from '../providers/JupiterProvider'

export const useSolanaSwap = (): {
  getQuote: (
    params: GetSvmQuoteParams
  ) => Promise<NormalizedSwapQuoteResult | undefined>
  swap: (params: SwapParams<JupiterQuote>) => Promise<string>
} => {
  const isSwapFeesJupiterBlocked = useSelector(selectIsSwapFeesJupiterBlocked)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { request } = useInAppRequest()

  const getQuote = useCallback(
    async (
      params: GetSvmQuoteParams
    ): Promise<NormalizedSwapQuoteResult | undefined> => {
      // abort previous request
      abortControllerRef.current?.abort()
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const platformFeeBps = isSwapFeesJupiterBlocked
          ? undefined
          : JUPITER_PARTNER_FEE_BPS
        return await JupiterProvider.getQuote(
          { ...params, platformFeeBps },
          controller.signal
        )
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
        txParams: SvmTransactionParams[],
        context?: Record<string, unknown>
      ): Promise<string> =>
        request({
          method: RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          params: txParams,
          chainId: getSolanaCaip2ChainId(network.chainId),
          context
        })

      return JupiterProvider.swap({
        network,
        userAddress: account.addressSVM,
        srcTokenAddress: fromTokenAddress,
        destTokenAddress: toTokenAddress,
        quote,
        slippage,
        signAndSend,
        isSwapFeesEnabled: !isSwapFeesJupiterBlocked
      })
    },
    [request, isSwapFeesJupiterBlocked]
  )

  return {
    getQuote,
    swap
  }
}
