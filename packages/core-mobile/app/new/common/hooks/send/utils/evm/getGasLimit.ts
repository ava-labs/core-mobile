import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import { TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import { SendErrorMessage } from '../types'
import { buildTx } from './buildEVMSendTx'

export const getGasLimit = async ({
  fromAddress,
  provider,
  token,
  toAddress,
  amount
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  token: TokenWithBalanceEVM
  toAddress: string
  amount: bigint
}): Promise<bigint> => {
  const tx = await buildTx({ fromAddress, provider, token, toAddress, amount })

  const [gasLimit, error] = await resolve(provider.estimateGas(tx))

  if (
    error &&
    !(error as Error).toString().includes('insufficient funds for gas')
  ) {
    Logger.error('failed to get gas limit', error)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
  }
  // add 20% padding to ensure the tx will be accepted
  return ((gasLimit ?? 0n) * 6n) / 5n
}
