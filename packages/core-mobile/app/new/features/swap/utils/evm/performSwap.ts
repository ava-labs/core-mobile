import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import Big from 'big.js'
import { OptimalRate, TransactionParams as Transaction } from '@paraswap/sdk'
import { promiseResolveWithBackoff, resolve } from '@avalabs/core-utils-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import { swapError } from 'errors/swapError'
import { ERC20__factory } from 'contracts/openzeppelin'
import { RequestContext } from 'store/rpc/types'
import {
  EVM_NATIVE_TOKEN_ADDRESS,
  PARASWAP_PARTNER_FEE_BPS,
  PARTNER_FEE_PARAMS
} from '../../consts'
import ParaswapService from '../../services/ParaswapService'

const PARTNER = 'Avalanche'

export type PerformSwapParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative: boolean
  destTokenAddress: string | undefined
  isDestTokenNative: boolean
  priceRoute: OptimalRate | undefined
  slippage: number
  network: Network | undefined
  provider: JsonRpcBatchInternal
  userAddress: string | undefined
  signAndSend: (
    txParams: [TransactionParams],
    context?: Record<string, unknown>
  ) => Promise<string>
  isSwapFeesEnabled: boolean
}

type SwapTxHash = string

export const performSwap = async ({
  srcTokenAddress,
  isSrcTokenNative,
  destTokenAddress,
  isDestTokenNative,
  priceRoute,
  slippage,
  network,
  provider,
  userAddress,
  signAndSend,
  isSwapFeesEnabled
}: // eslint-disable-next-line sonarjs/cognitive-complexity
PerformSwapParams): Promise<SwapTxHash> => {
  if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

  if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

  if (!priceRoute) throw swapError.missingParam('priceRoute')

  if (!userAddress) throw swapError.missingParam('userAddress')

  if (!network) throw swapError.missingParam('network')

  if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

  const sourceTokenAddress = isSrcTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : srcTokenAddress
  const destinationTokenAddress = isDestTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : destTokenAddress

  const slippagePercent = slippage / 100
  const feePercent = isSwapFeesEnabled ? PARASWAP_PARTNER_FEE_BPS / 10_000 : 0
  const totalPercent = slippagePercent + feePercent

  const minAmount = new Big(priceRoute.destAmount)
    .times(1 - totalPercent)
    .toFixed(0)

  const maxAmount = new Big(priceRoute.srcAmount)
    .times(1 + totalPercent)
    .toFixed(0)

  const sourceAmount =
    priceRoute.side === 'SELL' ? priceRoute.srcAmount : maxAmount

  const destinationAmount =
    priceRoute.side === 'SELL' ? minAmount : priceRoute.destAmount

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
          priceRoute,
          userAddress,
          partner: PARTNER,
          srcDecimals: priceRoute.srcDecimals,
          destDecimals: priceRoute.destDecimals,
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
