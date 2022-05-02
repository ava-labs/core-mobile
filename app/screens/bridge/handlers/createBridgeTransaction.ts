import { BridgeTransaction } from '@avalabs/bridge-sdk'

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
>

export type BTCTransactionResponse = {
  block_height: number
  block_index: number
  hash: string
  addresses: string[]
  total: number
  fees: number
  size: number
  vsize: number
  preference: string
  relayed_by: string
  received: string
  ver: number
  double_spend: boolean
  vin_sz: number
  vout_sz: number
  confirmations: number
  inputs: import('@avalabs/blockcypher-sdk').TxInput[]
  outputs: import('@avalabs/blockcypher-sdk').TxOutput[]
}

// /**
//  * Add a new pending bridge transaction to the background state and start the
//  * transaction tracking process.
//  */
// export async function createBridgeTransaction(
//   partialBridgeTransaction: PartialBridgeTransaction,
//   bridgeTransactions: { [key: string]: BridgeTransaction },
//   config: AppConfig,
//   network: ActiveNetwork,
//   addressC: string,
//   addressBTC: string
// ) {
//   const {
//     sourceChain,
//     sourceTxHash,
//     sourceStartedAt,
//     targetChain,
//     amount,
//     symbol
//   } = partialBridgeTransaction
//
//   if (!sourceChain) return { error: 'missing sourceChain' }
//   if (!sourceTxHash) return { error: 'missing sourceTxHash' }
//   if (!sourceStartedAt) return { error: 'missing sourceStartedAt' }
//   if (!targetChain) return { error: 'missing targetChain' }
//   if (!amount) return { error: 'missing amount' }
//   if (!symbol) return { error: 'missing symbol' }
//   if (!config) return { error: 'missing bridge config' }
//   if (bridgeTransactions[sourceTxHash])
//     return { error: 'bridge tx already exists' }
//
//   const isMainnet = isMainnetNetwork(network.config)
//   const requiredConfirmationCount = getMinimumConfirmations(sourceChain, config)
//
//   const bridgeTransaction: BridgeTransaction = {
//     /* from params */
//     sourceChain,
//     sourceTxHash,
//     sourceStartedAt,
//     targetChain,
//     amount,
//     symbol,
//     /* new fields */
//     addressC,
//     addressBTC,
//     complete: false,
//     confirmationCount: 0,
//     environment: isMainnet ? 'main' : 'test',
//     requiredConfirmationCount
//   }
//
//   // Save the initial version
//   const error = false // Save the initial version
//   // const error = await saveBridgeTransaction(bridgeTransaction);
//
//   // Start transaction tracking process (no need to await)
//   return trackBridgeTransaction(bridgeTransaction, config)
// }
