import * as ethers from 'ethers'
import {
  ExplainTransactionDto,
  Transaction as BlizzardTransaction
} from '@avalabs/blizzard-sdk'
import { RpcTxParams } from 'screens/rpc/util/types'

const blizzardURL = 'https://blizzard.avax-dev.network'

export function isTransactionDescriptionError(
  description: ethers.utils.TransactionDescription | { error: string }
) {
  return !!description && !('error' in description)
}

export async function getTxInfo(txParams: RpcTxParams, isMainnet: boolean) {
  const testTx = new BlizzardTransaction({
    baseUrl: blizzardURL
  })

  const data = {
    ...txParams,
    network: isMainnet ? 'mainnet' : 'fuji'
  }

  console.log('explain params', data)

  return await testTx.explainTx(data as ExplainTransactionDto)
}
