import { swapError } from 'errors/swapError'
import NetworkService from 'services/network/NetworkService'
import { isSolanaProvider, SolanaProvider } from '@avalabs/core-wallets-sdk'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { resolve, wait } from '@avalabs/core-utils-sdk'
import { fetchAndVerify } from 'utils/fetchAndVerify'
import Logger from 'utils/Logger'
import { signature, TransactionError } from '@solana/kit'
import { getJupiterFeeAccount } from '../utils/svm/getJupiterFeeAccount'
import { JUPITER_TX_SCHEMA } from '../utils/svm/schemas'
import { getSwapRate } from '../utils/svm/getSwapRate'
import {
  GetSvmQuoteParams,
  SwapProvider,
  SwapProviders,
  NormalizedSwapQuoteResult,
  PerformSwapSvmParams
} from '../types'
import { getJupiterUrl } from '../utils/svm/getJupiterUrl'

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
    const { quote } = await getSwapRate({
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
      metadata: {}
    }
    return {
      provider: SwapProviders.JUPITER,
      quotes: [normalizedQuote],
      selected: normalizedQuote
    }
  },

  async swap(params: PerformSwapSvmParams): Promise<string> {
    // validateSwapParams(params)

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

    // const isSelling = quote.swapMode === 'ExactIn'

    // const srcAmount = isSelling ? quote.outAmount : quote.inAmount
    // const destAmount = isSelling ? quote.inAmount : quote.outAmount

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
      fetchAndVerify(
        [
          getJupiterUrl('swap'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quoteResponse: quote,
              userPublicKey: userAddress,
              dynamicComputeUnitLimit: true, // Gives us a higher chance of the transaction landing
              feeAccount
            })
          }
        ],
        JUPITER_TX_SCHEMA
      )
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

    // if (isUserRejectionError(approvalTxError)) {
    //   throw approvalTxError
    // } else
    if (approvalTxError || !approvalTxHash) {
      throw swapError.approvalTxFailed(approvalTxError)
    }

    waitForTransaction(provider, approvalTxHash)
      .then(({ error }) => {
        if (error) {
          Logger.error(error.toString())
        }

        // onTransactionReceipt({
        //   isSuccessful: success,
        //   pendingToastId,
        //   userAddress: userPublicKey,
        //   txHash: txHash,
        //   chainId: network.chainId,
        //   srcToken,
        //   destToken,
        //   srcAmount,
        //   destAmount,
        //   srcDecimals,
        //   destDecimals
        // })
      })
      .catch(Logger.error)

    return approvalTxHash
  }
}

const waitForTransaction = async (
  provider: SolanaProvider,
  txHash: string
): Promise<{
  success: boolean
  error: TransactionError | null
}> => {
  const tx = await provider
    .getTransaction(signature(txHash), {
      encoding: 'jsonParsed',
      commitment: 'confirmed', // TODO: should we use 'finalized' here for max. certainty?
      maxSupportedTransactionVersion: 0
    })
    .send()

  if (!tx) {
    await wait(500)
    return waitForTransaction(provider, txHash)
  }

  if (tx.meta?.err) {
    return {
      success: false,
      error: tx.meta.err
    }
  }

  return {
    success: true,
    error: null
  }
}
