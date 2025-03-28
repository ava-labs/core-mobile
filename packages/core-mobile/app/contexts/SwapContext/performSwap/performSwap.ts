import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionParams } from '@avalabs/evm-module'
import Big from 'big.js'
import { OptimalRate, TransactionParams as Transaction } from '@paraswap/sdk'
import { promiseResolveWithBackoff, resolve } from '@avalabs/core-utils-sdk'
import { bigIntToHex } from '@ethereumjs/util'
import SwapService from 'services/swap/SwapService'
import { swapError } from 'errors/swapError'
import { ERC20__factory } from 'contracts/openzeppelin'
import { EVM_NATIVE_TOKEN_ADDRESS, PARTNER_FEE_PARAMS } from '../consts'

export type PerformSwapParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative: boolean
  destTokenAddress: string | undefined
  isDestTokenNative: boolean
  priceRoute: OptimalRate | undefined
  slippage: number
  activeNetwork: Network | undefined
  provider: JsonRpcBatchInternal
  userAddress: string | undefined
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
  isSwapFeesEnabled: boolean
}

// copied from https://github.com/ava-labs/avalanche-sdks/tree/alpha-release/packages/paraswap-sdk
// modified to use our new in app request for now
// TODO: move this back to the sdk once everything is stable

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function performSwap({
  srcTokenAddress,
  isSrcTokenNative,
  destTokenAddress,
  isDestTokenNative,
  priceRoute,
  slippage,
  activeNetwork,
  provider,
  userAddress,
  signAndSend,
  isSwapFeesEnabled
}: PerformSwapParams): Promise<{
  swapTxHash: string
  approveTxHash: string | undefined
}> {
  if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

  if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

  if (!priceRoute) throw swapError.missingParam('priceRoute')

  if (!userAddress) throw swapError.missingParam('userAddress')

  if (!activeNetwork) throw swapError.missingParam('activeNetwork')

  if (activeNetwork.isTestnet)
    throw swapError.networkNotSupported(activeNetwork.chainName)

  const sourceTokenAddress = isSrcTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : srcTokenAddress
  const destinationTokenAddress = isDestTokenNative
    ? EVM_NATIVE_TOKEN_ADDRESS
    : destTokenAddress

  const partner = 'Avalanche'

  let approveTxHash: string | undefined

  const minAmount = new Big(priceRoute.destAmount)
    .times(1 - slippage / 100)
    .toFixed(0)

  const maxAmount = new Big(priceRoute.srcAmount)
    .times(1 + slippage / 100)
    .toFixed(0)

  const sourceAmount =
    priceRoute.side === 'SELL' ? priceRoute.srcAmount : maxAmount

  const destinationAmount =
    priceRoute.side === 'SELL' ? minAmount : priceRoute.destAmount

  // no need to approve native token
  if (!isSrcTokenNative) {
    let spenderAddress: string

    try {
      spenderAddress = await SwapService.getParaswapSpender(activeNetwork)
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
        signAndSend([{ ...tx, gas }])
      )

      if (!approvalTxHash || approvalTxError) {
        throw swapError.approvalTxFailed(approvalTxError)
      }

      const receipt = await provider.waitForTransaction(approvalTxHash)

      if (!receipt || (receipt && receipt.status !== 1)) {
        throw swapError.approvalTxFailed(new Error('Transaction Reverted'))
      }

      approveTxHash = approvalTxHash
    } else {
      approveTxHash = undefined
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
        SwapService.buildTx({
          network: activeNetwork,
          srcToken: sourceTokenAddress,
          destToken: destinationTokenAddress,
          srcAmount: sourceAmount,
          destAmount: destinationAmount,
          priceRoute,
          userAddress,
          partner,
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

  return {
    swapTxHash,
    approveTxHash
  }
}
