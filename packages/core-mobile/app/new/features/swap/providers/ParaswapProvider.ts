import { TransactionParams } from '@avalabs/evm-module'
import { 
  GetQuoteParams, 
  isParaswapQuote, 
  NormalizedSwapQuote, 
  NormalizedSwapQuoteResult, 
  PerformSwapParams, 
  SwapProvider 
} from "../types"
import ParaswapService from '../services/ParaswapService'
import { TransactionParams as Transaction } from '@paraswap/sdk'
import { swapError } from 'errors/swapError'
import { 
  EVM_NATIVE_TOKEN_ADDRESS, 
  PARASWAP_PARTNER_FEE_BPS, 
  PARTNER_FEE_PARAMS 
} from '../consts'
import Big from 'big.js'
import { ERC20__factory } from 'contracts/openzeppelin'
import { 
  promiseResolveWithBackoff, 
  resolve 
} from '@avalabs/core-utils-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import { RequestContext } from 'store/rpc/types'

const PARTNER = 'Avalanche'

export const ParaswapProvider: SwapProvider = {
  name: "paraswap",

  async getQuote({
    fromTokenAddress,
    fromTokenDecimals,
    toTokenAddress,
    toTokenDecimals,
    amount,
    destination,
    network,
    account,
  }: GetQuoteParams, abortSignal?: AbortSignal): Promise<NormalizedSwapQuoteResult> {
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
      provider: this.name,
      quotes: [quote],
      selected: quote
    }
  },

  async swap({
    srcTokenAddress,
    isSrcTokenNative,
    destTokenAddress,
    isDestTokenNative,
    quote,
    slippage,
    network,
    provider,
    userAddress,
    signAndSend,
    isSwapFeesEnabled
  }: // eslint-disable-next-line sonarjs/cognitive-complexity
    PerformSwapParams) {
    if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

    if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

    if (!quote) throw swapError.missingParam('quote')

    if (!userAddress) throw swapError.missingParam('userAddress')

    if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

    if (!isParaswapQuote(quote)) {
      throw swapError.wrongQuoteProvider("paraswap")
    }

    const sourceTokenAddress = isSrcTokenNative
      ? EVM_NATIVE_TOKEN_ADDRESS
      : srcTokenAddress
    const destinationTokenAddress = isDestTokenNative
      ? EVM_NATIVE_TOKEN_ADDRESS
      : destTokenAddress

    const slippagePercent = slippage / 100
    const feePercent = isSwapFeesEnabled ? PARASWAP_PARTNER_FEE_BPS / 10_000 : 0
    const totalPercent = slippagePercent + feePercent

    const minAmount = new Big(quote.destAmount)
      .times(1 - totalPercent)
      .toFixed(0)

    const maxAmount = new Big(quote.srcAmount)
      .times(1 + totalPercent)
      .toFixed(0)

    const sourceAmount =
      quote.side === 'SELL' ? quote.srcAmount : maxAmount

    const destinationAmount =
      quote.side === 'SELL' ? minAmount : quote.destAmount

    // no need to approve native token
    if (!isSrcTokenNative) {
      let spenderAddress: string

      try {
        spenderAddress = await ParaswapService.getParaswapSpender(network)
      } catch (error) {
        throw swapError.cannotFetchSpender(error)
      }

      const contract = ERC20__factory.connect(sourceTokenAddress, provider)

      const [allowance, allowanceError] = await resolve<bigint>(
        contract.allowance(userAddress, spenderAddress)
      )

      if (allowance === null || allowanceError) {
        throw swapError.cannotFetchAllowance(allowanceError)
      }

      if (allowance < BigInt(sourceAmount)) {
        const { data } =
          (await contract.approve?.populateTransaction(
            spenderAddress,
            sourceAmount
          )) ?? {}

        const tx = {
          from: userAddress,
          to: sourceTokenAddress,
          data
        }

        const [approveGasLimit, approveGasLimitError] = await resolve(
          provider.estimateGas(tx)
        )

        if (approveGasLimitError || !approveGasLimit) {
          throw swapError.approvalTxFailed(approveGasLimitError)
        }

        const gas = bigIntToHex(approveGasLimit)

        const [approvalTxHash, approvalTxError] = await resolve(
          signAndSend([{ ...tx, gas }], {
            // we don't want to show confetti for token spend limit approvals
            [RequestContext.CONFETTI_DISABLED]: true
          })
        )

        if (!approvalTxHash || approvalTxError) {
          throw swapError.approvalTxFailed(approvalTxError)
        }

        const receipt = await provider.waitForTransaction(approvalTxHash)

        if (!receipt || (receipt && receipt.status !== 1)) {
          throw swapError.approvalTxFailed(new Error('Transaction Reverted'))
        }
      }
    }

    function checkForErrorsInResult(result: Transaction | Error): boolean {
      return (
        (result as Error).message === 'Server too busy' ||
        // paraswap returns responses like this: {error: 'Not enough 0x4f60a160d8c2dddaafe16fcc57566db84d674…}
        // when they are too slow to detect the approval
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any).error ||
        result instanceof Error
      )
    }

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

    const txParams: [TransactionParams] = [
      {
        from: userAddress,
        to: txBuildData.to,
        gas:
          txBuildData.gas !== undefined
            ? bigIntToHex(BigInt(txBuildData.gas))
            : undefined,
        data: txBuildData.data,
        value: isSrcTokenNative ? bigIntToHex(BigInt(sourceAmount)) : undefined // AVAX value needs to be sent with the transaction
      }
    ]

    const [swapTxHash, swapTxError] = await resolve(signAndSend(txParams))

    if (!swapTxHash || swapTxError) {
      throw swapError.swapTxFailed(swapTxError)
    }

    return swapTxHash
  }
}