import { swapError } from 'errors/swapError'
import NetworkService from 'services/network/NetworkService'
import { isSolanaProvider } from '@avalabs/core-wallets-sdk'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { resolve } from '@avalabs/core-utils-sdk'
import { getJupiterFeeAccount } from '../utils/svm/getJupiterFeeAccount'
import {
  GetSvmQuoteParams,
  SwapProvider,
  SwapProviders,
  NormalizedSwapQuoteResult,
  PerformSwapSvmParams
} from '../types'
import { jupiterApi } from '../utils/svm/jupiterApi.client'
import JupiterService from '../services/JupiterService'

export const JupiterProvider: SwapProvider<
  GetSvmQuoteParams,
  PerformSwapSvmParams
> = {
  name: SwapProviders.JUPITER,

  async getQuote(
    {
      fromTokenAddress,
      fromTokenDecimals,
      fromTokenBalance,
      toTokenAddress,
      toTokenDecimals,
      amount,
      destination,
      network,
      slippage,
      platformFeeBps
    }: GetSvmQuoteParams,
    abortSignal?: AbortSignal
  ): Promise<NormalizedSwapQuoteResult> {
    const { quote } = await JupiterService.getSwapRate({
      fromTokenAddress,
      fromTokenDecimals,
      fromTokenBalance,
      toTokenAddress,
      toTokenDecimals,
      amount,
      swapSide: destination,
      network,
      abortSignal,
      slippage,
      platformFeeBps
    })

    const normalizedQuote = {
      quote,
      metadata: {
        amountIn: quote.inAmount,
        amountOut: quote.outAmount
      }
    }
    return {
      provider: SwapProviders.JUPITER,
      quotes: [normalizedQuote],
      selected: normalizedQuote
    }
  },

  async swap(params: PerformSwapSvmParams): Promise<string> {
    const {
      userAddress,
      quote,
      srcTokenAddress,
      destTokenAddress,
      slippage,
      isSwapFeesEnabled,
      network,
      signAndSend
    } = params
    if (!userAddress) throw swapError.missingParam('userAddress')

    if (!quote) throw swapError.missingParam('quote')

    if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

    if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

    if (!slippage) throw swapError.missingParam('slippage')

    const provider = await NetworkService.getProviderForNetwork(network)

    if (!isSolanaProvider(provider)) {
      throw swapError.networkNotSupported(network.chainName)
    }

    const feeAccount = await getJupiterFeeAccount({
      isSwapFeesEnabled: isSwapFeesEnabled ?? false,
      quote,
      provider,
      onFeeAccountNotInitialized: mint => {
        AnalyticsService.capture('SolanaSwapFeeAccountNotInitialized', {
          mint
        })
      }
    })

    const [txResponse, buildTxError] = await resolve(
      jupiterApi.swap({
        quoteResponse: quote,
        userPublicKey: userAddress,
        dynamicComputeUnitLimit: true, // Gives us a higher chance of the transaction landing
        feeAccount
      })
    )

    if (!txResponse || buildTxError) {
      throw swapError.cannotBuildTx(buildTxError)
    }

    // The /swap endpoint may return errors, as it attempts to simulate the transaction too.
    if (txResponse.simulationError) {
      throw swapError.swapTxFailed(txResponse.simulationError)
    }

    const [approvalTxHash, approvalTxError] = await resolve(
      signAndSend([
        {
          account: userAddress,
          serializedTx: txResponse.swapTransaction
        }
      ])
    )

    if (approvalTxError || !approvalTxHash) {
      throw swapError.approvalTxFailed(approvalTxError)
    }

    return approvalTxHash
  }
}
