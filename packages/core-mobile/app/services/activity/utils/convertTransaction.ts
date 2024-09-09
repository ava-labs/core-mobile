import { CriticalConfig } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  Transaction as InternalTransaction,
  TransactionType,
  TokenType
} from '@avalabs/vm-module-types'
import {
  isBridgeTransactionBTC,
  isBridgeTransactionEthereum,
  isBridgeTransactionERC20
} from 'screens/bridge/utils/bridgeUtils'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { Transaction } from 'store/transaction'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'

export const convertTransaction = (
  transaction: InternalTransaction,
  network: Network,
  criticalConfig: CriticalConfig | undefined
): Transaction => {
  const bridgeAddresses = UnifiedBridgeService.getBridgeAddresses()
  const isBridge = isEthereumNetwork(network)
    ? isBridgeTransactionEthereum({
        transaction,
        network,
        criticalConfig,
        bridgeAddresses
      })
    : isBitcoinNetwork(network)
    ? isBridgeTransactionBTC(
        transaction,
        criticalConfig?.criticalBitcoin?.walletAddresses
      )
    : transaction.tokens[0]?.type === TokenType.ERC20
    ? isBridgeTransactionERC20({
        token: transaction.tokens[0],
        bridgeAddresses
      })
    : false

  return {
    ...transaction,
    isBridge,
    txType: isBridge
      ? TransactionType.BRIDGE
      : transaction.txType
      ? transaction.txType
      : TransactionType.UNKNOWN
  }
}
