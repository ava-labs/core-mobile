import { TransactionParams } from '@avalabs/evm-module'
import { OptimalRate, TransactionParams as Transaction } from '@paraswap/sdk'
import { swapError } from 'errors/swapError'
import Big from 'big.js'
import { promiseResolveWithBackoff, resolve } from '@avalabs/core-utils-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import {
  EVM_NATIVE_TOKEN_ADDRESS,
  PARASWAP_PARTNER_FEE_BPS,
  PARTNER_FEE_PARAMS
} from '../consts'
import ParaswapService from '../services/ParaswapService'
import {
  GetQuoteParams,
  isParaswapQuote,
  NormalizedSwapQuote,
  NormalizedSwapQuoteResult,
  PerformSwapParams,
  SwapProvider,
  SwapProviders
} from '../types'
import { ensureAllowance } from '../utils/evm/ensureAllowance'

const PARTNER = 'Avalanche'

const validateSwapParams = (params: PerformSwapParams): void => {
  const { srcTokenAddress, destTokenAddress, quote, userAddress, network } =
    params

  if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')
  if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')
  if (!quote) throw swapError.missingParam('quote')
  if (!userAddress) throw swapError.missingParam('userAddress')

  if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

  if (!isParaswapQuote(quote)) {
    throw swapError.wrongQuoteProvider('paraswap')
  }
}

const calculateSwapAmounts = (
  quote: OptimalRate,
  slippage: number,
  isSwapFeesEnabled: boolean
): { sourceAmount: string; destinationAmount: string } => {
  const { srcAmount, destAmount, side } = quote

  const slippagePercent = slippage / 100
  const feePercent = isSwapFeesEnabled ? PARASWAP_PARTNER_FEE_BPS / 10_000 : 0
  const totalPercent = slippagePercent + feePercent

  const minAmount = new Big(destAmount).times(1 - totalPercent).toFixed(0)

  const maxAmount = new Big(srcAmount).times(1 + totalPercent).toFixed(0)

  const sourceAmount = side === 'SELL' ? srcAmount : maxAmount
  const destinationAmount = side === 'SELL' ? minAmount : destAmount

  return {
    sourceAmount,
    destinationAmount
  }
}

const handleTokenApproval = async (
  params: PerformSwapParams,
  sourceAmount: string
): Promise<void> => {
  const {
    isSrcTokenNative,
    srcTokenAddress,
    provider,
    signAndSend,
    userAddress,
    network
  } = params

  if (isSrcTokenNative) {
    return // no need to approve native token
  }

  // These should be validated by validateSwapParams, but adding type guards for safety
  if (!srcTokenAddress || !userAddress) {
    throw new Error('Required parameters are missing')
  }

  let spenderAddress: string

  try {
    spenderAddress = await ParaswapService.getParaswapSpender(network)
  } catch (error) {
    throw swapError.cannotFetchSpender(error)
  }

  const approvalTxHash = await ensureAllowance({
    amount: BigInt(sourceAmount),
    provider,
    signAndSend,
    spenderAddress,
    tokenAddress: srcTokenAddress,
    userAddress
  })

  if (approvalTxHash) {
    const receipt = await provider.waitForTransaction(approvalTxHash)

    if (!receipt || (receipt && receipt.status !== 1)) {
      throw swapError.approvalTxFailed(new Error('Transaction Reverted'))
    }
  }
}

const checkForErrorsInResult = (result: Transaction | Error): boolean => {
  return (
    (result as Error).message === 'Server too busy' ||
    // paraswap returns responses like this: {error: 'Not enough 0x4f60a160d8c2dddaafe16fcc57566db84d674…}
    // when they are too slow to detect the approval
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any).error ||
    result instanceof Error
  )
}

const buildSwapTransaction = async (
  params: PerformSwapParams,
  sourceAmount: string,
  destinationAmount: string
): Promise<TransactionParams> => {
  const {
    isSrcTokenNative,
    srcTokenAddress,
    isDestTokenNative,
    destTokenAddress,
    quote,
    network,
    userAddress,
    isSwapFeesEnabled
  } = params

  // These should be validated by validateSwapParams, but adding type guards for safety
  if (!srcTokenAddress || !destTokenAddress || !quote || !userAddress) {
    throw new Error('Required parameters are missing')
  }

  if (!isParaswapQuote(quote)) {
    throw swapError.wrongQuoteProvider(SwapProviders.MARKR)
  }

  const sourceTokenAddress = isSrcTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : srcTokenAddress
  const destinationTokenAddress = isDestTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : destTokenAddress

  const [txBuildData, txBuildDataError] = await resolve(
    promiseResolveWithBackoff(
      () =>
        ParaswapService.buildTx({
          network,
          srcToken: sourceTokenAddress,
          destToken: destinationTokenAddress,
          srcAmount: sourceAmount,
          destAmount: destinationAmount,
          priceRoute: quote,
          userAddress,
          partner: PARTNER,
          srcDecimals: quote.srcDecimals,
          destDecimals: quote.destDecimals,
          ...(isSwapFeesEnabled && PARTNER_FEE_PARAMS)
        }),
      checkForErrorsInResult,
      0,
      10
    )
  )

  if (!txBuildData || txBuildDataError) {
    throw swapError.cannotBuildTx(txBuildDataError)
  }

  return {
    from: userAddress,
    to: txBuildData.to,
    gas:
      txBuildData.gas !== undefined
        ? bigIntToHex(BigInt(txBuildData.gas))
        : undefined,
    data: txBuildData.data,
    value: isSrcTokenNative ? bigIntToHex(BigInt(sourceAmount)) : undefined // AVAX value needs to be sent with the transaction
  }
}

const executeSwapTransaction = async (
  params: PerformSwapParams,
  tx: TransactionParams
): Promise<string> => {
  const { userAddress, signAndSend } = params

  // This should be validated by validateSwapParams, but adding type guard for safety
  if (!userAddress) {
    throw new Error('Required parameters are missing')
  }

  const txParams: [TransactionParams] = [tx]

  const [swapTxHash, swapTxError] = await resolve(signAndSend(txParams))

  if (!swapTxHash || swapTxError) {
    throw swapError.swapTxFailed(swapTxError)
  }

  return swapTxHash
}

export const ParaswapProvider: SwapProvider = {
  name: 'paraswap',

  async getQuote(
    {
      fromTokenAddress,
      fromTokenDecimals,
      toTokenAddress,
      toTokenDecimals,
      amount,
      destination,
      network,
      account
    }: GetQuoteParams,
    abortSignal?: AbortSignal
  ): Promise<NormalizedSwapQuoteResult> {
    if (!fromTokenAddress || !fromTokenDecimals) {
      throw new Error('No source token selected')
    }

    if (!toTokenAddress || !toTokenDecimals) {
      throw new Error('No destination token selected')
    }

    if (!amount) {
      throw new Error('No amount')
    }

    if (!abortSignal) {
      throw new Error('abortSignal is required when swap provider is enabled')
    }

    const rate = await ParaswapService.getSwapRate({
      srcToken: fromTokenAddress,
      srcDecimals: fromTokenDecimals,
      destToken: toTokenAddress,
      destDecimals: toTokenDecimals,
      srcAmount: amount.toString(),
      swapSide: destination,
      network: network,
      account: account,
      abortSignal
    })

    const quote: NormalizedSwapQuote = {
      quote: rate,
      metadata: {
        amountOut: rate.destAmount
      }
    }

    return {
      provider: SwapProviders.PARASWAP,
      quotes: [quote],
      selected: quote
    }
  },

  async swap(params: PerformSwapParams) {
    validateSwapParams(params)

    const { quote, slippage, isSwapFeesEnabled } = params

    // Type guard to ensure quote is a MarkrQuote
    if (!quote || !isParaswapQuote(quote)) {
      throw swapError.wrongQuoteProvider(SwapProviders.MARKR)
    }

    const { sourceAmount, destinationAmount } = calculateSwapAmounts(
      quote,
      slippage,
      isSwapFeesEnabled || false
    )

    await handleTokenApproval(params, sourceAmount)

    const tx = await buildSwapTransaction(
      params,
      sourceAmount,
      destinationAmount
    )

    return await executeSwapTransaction(params, tx)
  }
}
