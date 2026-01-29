import { TransactionParams } from '@avalabs/evm-module'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { swapError } from 'errors/swapError'
import { EvmWrapQuote } from '../../types'
import { buildWrapTx } from './buildWrapTx'
import { getWrapUnwrapAbi } from './getWrapUnwrapAbi'

type TxHash = string

// wrap a token via the standard contract
export const wrap = async ({
  userAddress,
  network,
  provider,
  quote,
  signAndSend
}: {
  userAddress: string
  network: Network
  provider: JsonRpcBatchInternal
  quote: EvmWrapQuote
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
}): Promise<TxHash> => {
  if (network.isTestnet) throw swapError.networkNotSupported(network.chainName)

  const tokenAddress = quote.target.toLowerCase()

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

  const tx = await buildWrapTx(txParams)

  const [txHash, txError] = await resolve(signAndSend([tx]))

  if (!txHash || txError) {
    throw swapError.swapTxFailed(txError)
  }

  return txHash
}
