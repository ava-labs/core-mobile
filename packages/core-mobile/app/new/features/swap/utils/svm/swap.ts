import { swapError } from 'errors/swapError'
import NetworkService from 'services/network/NetworkService'
import { Network } from '@avalabs/core-chains-sdk'
import { isSolanaProvider, SolanaProvider } from '@avalabs/core-wallets-sdk'
import { resolve, wait } from '@avalabs/core-utils-sdk'
import { fetchAndVerify } from 'utils/fetchAndVerify'
import { signature, TransactionError } from '@solana/kit'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { JUPITER_TX_SCHEMA, JupiterQuote } from './schemas'
import { getJupiterFeeAccount } from './getJupiterFeeAccount'
import { getUrl } from './getUrl'

export const svmSwap = async ({
  network,
  fromTokenAddress,
  toTokenAddress,
  userAddress,
  quote,
  slippage,
  signAndSend,
  isSwapFeesJupiterBlocked
}: {
  network: Network
  fromTokenAddress: string
  toTokenAddress: string
  userAddress: string | undefined
  quote: JupiterQuote
  slippage: number
  signAndSend: (
    txParams: {
      account: string
      serializedTx: string
    }[],
    context?: Record<string, unknown>
  ) => Promise<string>
  isSwapFeesJupiterBlocked: boolean
}): Promise<string> => {
  if (!userAddress) throw swapError.missingParam('userAddress')

  if (!quote) throw swapError.missingParam('quote')

  if (!fromTokenAddress) throw swapError.missingParam('fromTokenAddress')

  if (!toTokenAddress) throw swapError.missingParam('toTokenAddress')

  if (!slippage) throw swapError.missingParam('slippage')

  // const isSelling = quote.swapMode === 'ExactIn'

  // const srcAmount = isSelling ? quote.outAmount : quote.inAmount
  // const destAmount = isSelling ? quote.inAmount : quote.outAmount

  const provider = await NetworkService.getProviderForNetwork(network)

  if (!isSolanaProvider(provider)) {
    throw swapError.networkNotSupported(network.chainName)
  }

  const feeAccount = await getJupiterFeeAccount({
    isSwapFeesJupiterBlocked,
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
        getUrl('swap'),
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
