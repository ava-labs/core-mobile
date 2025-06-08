import { TransactionParams } from '@avalabs/evm-module'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { swapError } from 'errors/swapError'
import WAVAX_ABI from '../../../../../contracts/ABI_WAVAX.json'
import WETH_ABI from '../../../../../contracts/ABI_WETH.json'
import { EvmWrapQuote, EvmUnwrapQuote, isEvmWrapQuote } from '../../types'
import { WAVAX_ADDRESS, WETH_ADDRESS } from '../../consts'
import { buildWrapTx } from './buildWrapTx'
import { buildUnwrapTx } from './buildUnwrapTx'

type SwapTxHash = string

// perform a manual swap via the official wrap/unwrap contract
export const manualSwap = async ({
  userAddress,
  network,
  provider,
  quote,
  signAndSend
}: {
  userAddress: string
  network: Network
  provider: JsonRpcBatchInternal
  quote: EvmWrapQuote | EvmUnwrapQuote
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
}): Promise<SwapTxHash> => {
  if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

  const isEvmWrap = isEvmWrapQuote(quote)
  const tokenAddress = (isEvmWrap ? quote.target : quote.source).toLowerCase()

  const amount = quote.amount

  const abi =
    tokenAddress === WETH_ADDRESS
      ? WETH_ABI
      : tokenAddress === WAVAX_ADDRESS
      ? WAVAX_ABI
      : undefined

  if (!abi) throw swapError.incorrectTokenAddress(tokenAddress)

  const txParams = {
    userAddress,
    tokenAddress,
    amount,
    provider,
    abi
  }

  const tx = isEvmWrap
    ? await buildWrapTx(txParams)
    : await buildUnwrapTx(txParams)

  const [swapTxHash, swapTxError] = await resolve(signAndSend([tx]))

  if (!swapTxHash || swapTxError) {
    throw swapError.swapTxFailed(swapTxError)
  }

  return swapTxHash
}
