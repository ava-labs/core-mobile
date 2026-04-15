import { Network } from '@avalabs/core-chains-sdk'
import { SigningData } from '@avalabs/vm-module-types'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'

export interface FundTxParams {
  signingData: SigningData
  addressFrom: string
  provider: JsonRpcBatchInternal
  network: Network
  maxFeePerGas?: bigint
  waitForConfirmation: boolean
}
