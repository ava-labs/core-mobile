import { TransactionParams } from '@avalabs/evm-module'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { swapError } from 'errors/swapError'
import { EvmUnwrapQuote } from '../../types'
import { buildUnwrapTx } from './buildUnwrapTx'
import { getWrapUnwrapAbi } from './getWrapUnwrapAbi'

type TxHash = string

// unwrap a token via the standard contract
export const unwrap = async ({
  userAddress,
  network,
  provider,
  quote,
  signAndSend
}: {
  userAddress: string
  network: Network
  provider: JsonRpcBatchInternal
  quote: EvmUnwrapQuote
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
}): Promise<TxHash> => {
  if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

  const tokenAddress = quote.source.toLowerCase()

  const amount = quote.amount

  const abi = getWrapUnwrapAbi(tokenAddress)

  if (!abi) throw swapError.incorrectTokenAddress(tokenAddress)

  const txParams = {
    userAddress,
    tokenAddress,
    amount,
    provider,
    abi
  }

  const tx = await buildUnwrapTx(txParams)

  const [txHash, txError] = await resolve(signAndSend([tx]))

  if (!txHash || txError) {
    throw swapError.swapTxFailed(txError)
  }

  return txHash
}
