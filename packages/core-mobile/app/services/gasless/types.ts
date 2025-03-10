import { SigningData } from '@avalabs/vm-module-types'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'

export interface FundTxParams {
  signingData: SigningData
  addressFrom: string
  provider: JsonRpcBatchInternal
  maxFeePerGas?: bigint
}
