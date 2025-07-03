import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import Big from 'big.js'
import { resolve } from '@avalabs/core-utils-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import { swapError } from 'errors/swapError'
import { ERC20__factory } from 'contracts/openzeppelin'
import { RequestContext } from 'store/rpc/types'
import { buildSwapTransaction } from 'swap/buildSwapTransaction'
import { MarkrQuote, MarkrTransaction } from 'features/swap/types'
import { MARKR_EVM_NATIVE_TOKEN_ADDRESS, MARKR_EVM_PARTNER_ID } from 'features/swap/consts'

export type PerformMarkrSwapParams = {
  srcTokenAddress: string | undefined
  destTokenAddress: string | undefined
  quote: MarkrQuote
  slippage: number
  network: Network | undefined
  provider: JsonRpcBatchInternal
  userAddress: string | undefined
  signAndSend: (
    txParams: [TransactionParams],
    context?: Record<string, unknown>
  ) => Promise<string>
}

type SwapTxHash = string

// perform a swap via markr
export const markrSwap = async ({
  srcTokenAddress,
  destTokenAddress,
  quote,
  slippage,
  network,
  provider,
  userAddress,
  signAndSend
}: PerformMarkrSwapParams): Promise<SwapTxHash> => {
  if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

  if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

  if (!quote) throw swapError.missingParam('quote')

  const { amountIn, amountOut } = quote

  if (!amountIn || !amountOut) throw swapError.missingParam('quote')

  if (!userAddress) throw swapError.missingParam('userAddress')

  if (!network) throw swapError.missingParam('activeNetwork')

  if (network.isTestnet)
    throw swapError.networkNotSupported(network.chainName)

  const slippagePercent = slippage / 100
  // const feePercent = isSwapFeesEnabled ? MARKR_PARTNER_FEE_BPS / 10_000 : 0
  const totalPercent = slippagePercent

  const minAmount = new Big(amountOut)
    .times(1 - totalPercent)
    .toFixed(0)

  const sourceAmount = amountIn
  const destinationAmount = minAmount

  const isSrcTokenNative = srcTokenAddress === MARKR_EVM_NATIVE_TOKEN_ADDRESS

  const tx: MarkrTransaction = await buildSwapTransaction({ 
    quote, 
    tokenIn: srcTokenAddress, 
    tokenOut: destTokenAddress, 
    amountIn: sourceAmount, 
    minAmountOut: destinationAmount, 
    appId: MARKR_EVM_PARTNER_ID, 
    network,
    from: userAddress
  })

  // no need to approve native token
  if (!isSrcTokenNative) {
    const spenderAddress: string = tx.to

    const contract = ERC20__factory.connect(srcTokenAddress, provider)

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
        to: srcTokenAddress,
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

  const txParams: [TransactionParams] = [
    {
      from: userAddress,
      to: tx.to,
      gas: undefined,
      data: tx.data,
      value: isSrcTokenNative ? bigIntToHex(BigInt(sourceAmount)) : undefined // AVAX value needs to be sent with the transaction
    }
  ]

  const [swapTxHash, swapTxError] = await resolve(signAndSend(txParams))

  if (!swapTxHash || swapTxError) {
    throw swapError.swapTxFailed(swapTxError)
  }

  return swapTxHash
}
