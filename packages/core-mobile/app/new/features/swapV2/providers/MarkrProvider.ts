import { swapError } from 'errors/swapError'
import { resolve } from '@avalabs/core-utils-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import { bigIntToHex } from '@ethereumjs/util'
import Big from 'big.js'
import {
  GetEvmQuoteParams,
  GetQuoteParams,
  isMarkrQuote,
  NormalizedSwapQuote,
  NormalizedSwapQuoteResult,
  PerformSwapEvmParams,
  SwapProvider,
  SwapProviders
} from '../types'
import MarkrService, { MarkrQuote } from '../services/MarkrService'
import { MARKR_EVM_NATIVE_TOKEN_ADDRESS, MARKR_EVM_PARTNER_ID } from '../consts'
import { ensureAllowance } from '../utils/evm/ensureAllowance'

const getNormalizedQuoteResult = (
  rates: MarkrQuote[]
): NormalizedSwapQuoteResult | undefined => {
  const quotes: NormalizedSwapQuote[] = []

  for (const rate of rates) {
    const quote: NormalizedSwapQuote = {
      quote: rate,
      metadata: {
        amountOut: rate.amountOut,
        amountIn: rate.amountIn
      }
    }
    quotes.push(quote)
  }

  if (quotes.length === 0 || !quotes[0]) {
    return undefined
  }

  return {
    provider: SwapProviders.MARKR,
    quotes: quotes,
    selected: quotes[0]
  }
}

const validateQuoteParams = (params: GetQuoteParams): void => {
  const {
    fromTokenAddress,
    fromTokenDecimals,
    toTokenAddress,
    toTokenDecimals,
    amount
  } = params

  if (!fromTokenAddress || !fromTokenDecimals) {
    throw new Error('No source token selected')
  }

  if (!toTokenAddress || !toTokenDecimals) {
    throw new Error('No destination token selected')
  }

  if (!amount) {
    throw new Error('No amount')
  }
}

const validateSwapParams = (params: PerformSwapEvmParams): void => {
  const { srcTokenAddress, destTokenAddress, quote, userAddress, network } =
    params

  if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')
  if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')
  if (!quote) throw swapError.missingParam('quote')
  if (!userAddress) throw swapError.missingParam('userAddress')
  if (!network) throw swapError.missingParam('network')

  if (network.isTestnet) {
    throw swapError.networkNotSupported(network.chainName)
  }

  if (!isMarkrQuote(quote)) {
    throw swapError.wrongQuoteProvider(SwapProviders.MARKR)
  }

  const { amountIn, amountOut } = quote
  if (!amountIn || !amountOut) throw swapError.missingParam('quote')
}

const calculateSwapAmounts = (
  quote: MarkrQuote,
  slippage: number
): { sourceAmount: string; destinationAmount: string } => {
  const { amountIn, amountOut } = quote

  const slippagePercent = slippage / 100
  // const feePercent = isSwapFeesEnabled ? MARKR_PARTNER_FEE_BPS / 10_000 : 0
  const totalPercent = slippagePercent
  const minAmount = new Big(amountOut).times(1 - totalPercent).toFixed(0)

  return {
    sourceAmount: amountIn,
    destinationAmount: minAmount
  }
}

const buildSwapTransaction = async (
  params: PerformSwapEvmParams,
  sourceAmount: string,
  destinationAmount: string
): Promise<TransactionParams> => {
  const {
    isSrcTokenNative,
    srcTokenAddress,
    isDestTokenNative,
    destTokenAddress,
    quote,
    provider,
    network,
    userAddress,
    markrSwapGasBuffer
  } = params

  // These should be validated by validateSwapParams, but adding type guards for safety
  if (
    !srcTokenAddress ||
    !destTokenAddress ||
    !quote ||
    !userAddress ||
    !network ||
    !markrSwapGasBuffer
  ) {
    throw new Error('Required parameters are missing')
  }

  if (!isMarkrQuote(quote)) {
    throw swapError.wrongQuoteProvider(SwapProviders.MARKR)
  }

  const tx = await MarkrService.buildSwapTransaction({
    quote,
    tokenIn: isSrcTokenNative
      ? MARKR_EVM_NATIVE_TOKEN_ADDRESS
      : srcTokenAddress,
    tokenOut: isDestTokenNative
      ? MARKR_EVM_NATIVE_TOKEN_ADDRESS
      : destTokenAddress,
    amountIn: sourceAmount,
    minAmountOut: destinationAmount,
    appId: MARKR_EVM_PARTNER_ID,
    network,
    from: userAddress
  }).catch(error => {
    throw swapError.cannotBuildTx(error)
  })

  const props = {
    from: userAddress,
    to: tx.to,
    gas: undefined,
    data: tx.data,
    value: isSrcTokenNative ? bigIntToHex(BigInt(sourceAmount)) : undefined
  }

  const [swapGasLimit, swapGasLimitError] = await resolve(
    provider.estimateGas(props)
  )

  if (swapGasLimitError || !swapGasLimit) {
    throw swapError.unableToEstimateGas(swapGasLimitError)
  }

  const gas = bigIntToHex((swapGasLimit * BigInt(markrSwapGasBuffer)) / 100n)

  return { ...props, gas }
}

const handleTokenApproval = async (
  params: PerformSwapEvmParams,
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

  const spenderAddress = await MarkrService.getSpenderAddress({
    chainId: network.chainId
  }).catch(() => {
    throw new Error('Error getting spender address')
  })

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

const executeSwapTransaction = async (
  params: PerformSwapEvmParams,
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

export const MarkrProvider: SwapProvider<
  GetEvmQuoteParams,
  PerformSwapEvmParams
> = {
  name: SwapProviders.MARKR,

  async getQuote(
    {
      isFromTokenNative,
      fromTokenAddress,
      fromTokenDecimals,
      isToTokenNative,
      toTokenAddress,
      toTokenDecimals,
      amount,
      network,
      address,
      slippage,
      onUpdate,
      destination
    }: GetEvmQuoteParams,
    abortSignal?: AbortSignal
  ): Promise<NormalizedSwapQuoteResult> {
    validateQuoteParams({
      isFromTokenNative,
      fromTokenAddress,
      fromTokenDecimals,
      isToTokenNative,
      toTokenAddress,
      toTokenDecimals,
      amount,
      network,
      address,
      slippage,
      destination
    })

    if (!onUpdate) {
      throw new Error('onUpdate is required when swap use markr is enabled')
    }

    if (!abortSignal) {
      throw new Error('abortSignal is required when swap provider is enabled')
    }

    const onUpdateOverridden = (rates: MarkrQuote[] | undefined): void => {
      if (!rates) {
        return
      }

      const result = getNormalizedQuoteResult(rates)
      if (result === undefined) {
        return
      }

      onUpdate(result)
    }

    const rates = await MarkrService.getSwapRateStream({
      fromTokenAddress: isFromTokenNative
        ? MARKR_EVM_NATIVE_TOKEN_ADDRESS
        : fromTokenAddress,
      toTokenAddress: isToTokenNative
        ? MARKR_EVM_NATIVE_TOKEN_ADDRESS
        : toTokenAddress,
      fromTokenDecimals,
      toTokenDecimals,
      amount: amount.toString(),
      network,
      address,
      slippage,
      onUpdate: onUpdateOverridden,
      abortSignal: abortSignal
    })

    if (!rates || rates.length === 0) {
      throw new Error('No rate found')
    }

    const result = getNormalizedQuoteResult(rates)
    if (result === undefined) {
      throw new Error('No rate found')
    }

    return result
  },

  async swap(params: PerformSwapEvmParams) {
    validateSwapParams(params)

    const { quote, slippage } = params

    // Type guard to ensure quote is a MarkrQuote
    if (!quote || !isMarkrQuote(quote)) {
      throw swapError.wrongQuoteProvider(SwapProviders.MARKR)
    }

    const { sourceAmount, destinationAmount } = calculateSwapAmounts(
      quote,
      slippage
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
