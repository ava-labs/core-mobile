import { BridgeTransaction, useBridgeSDK } from '@avalabs/bridge-sdk'
import { isPendingBridgeTransaction } from 'screens/bridge/utils/bridgeTransactionUtils'
import { Transaction } from 'store/transaction'

export function useBlockchainNames(item: Transaction | BridgeTransaction) {
  const pending = isPendingBridgeTransaction(item)
  const { avalancheAssets, criticalConfig } = useBridgeSDK()

  if (pending) {
    return {
      sourceBlockchain: titleCase(item.sourceChain),
      targetBlockchain: titleCase(item.targetChain)
    }
  }

  const symbol = (item.token?.symbol ?? '').split('.')[0]

  const bridgeAddresses = criticalConfig
    ? [
        criticalConfig.critical.walletAddresses.avalanche?.toLowerCase(),
        criticalConfig.critical.walletAddresses.ethereum?.toLowerCase(),
        criticalConfig.criticalBitcoin.walletAddresses.avalanche.toLowerCase(),
        criticalConfig.criticalBitcoin.walletAddresses.btc.toLowerCase()
      ]
    : []
  const isToAvalanche = bridgeAddresses.includes(item.to.toLowerCase())
  const txBlockchain = titleCase(
    avalancheAssets[symbol]?.nativeNetwork || 'N/A'
  )

  return {
    sourceBlockchain: isToAvalanche ? txBlockchain : 'Avalanche',
    targetBlockchain: isToAvalanche ? 'Avalanche' : txBlockchain
  }
}

function titleCase(name: string) {
  return name[0].toUpperCase() + name.slice(1)
}
