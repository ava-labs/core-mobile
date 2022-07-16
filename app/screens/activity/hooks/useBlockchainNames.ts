import { BridgeTransaction, useBridgeSDK } from '@avalabs/bridge-sdk'
import { isPendingBridgeTransaction } from 'screens/bridge/utils/bridgeTransactionUtils'
import { Transaction } from 'store/transaction'

export function useBlockchainNames(item: Transaction | BridgeTransaction) {
  const pending = isPendingBridgeTransaction(item)
  const { avalancheAssets } = useBridgeSDK()

  const symbol = (
    !pending
      ? item.token?.symbol === 'TEST.t'
        ? // TEMP: use "BTC" when "TEST.t" until testnet changes
          'BTC'
        : item.token?.symbol ?? ''
      : ''
  ).split('.')[0]

  if (pending) {
    return {
      sourceBlockchain: titleCase(item.sourceChain),
      targetBlockchain: titleCase(item.targetChain)
    }
  }

  const isToAvalanche =
    item.from === '0x0000000000000000000000000000000000000000'
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
