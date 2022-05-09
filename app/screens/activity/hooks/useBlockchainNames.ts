import { BridgeTransaction, useBridgeSDK } from '@avalabs/bridge-sdk'
import { TransactionERC20 } from '@avalabs/wallet-react-components'
import { isPendingBridgeTransaction } from 'screens/bridge/utils/bridgeTransactionUtils'

export function useBlockchainNames(item: TransactionERC20 | BridgeTransaction) {
  const pending = isPendingBridgeTransaction(item)
  const { avalancheAssets } = useBridgeSDK()

  const symbol = (
    !pending
      ? item.tokenSymbol === 'TEST.t'
        ? // TEMP: use "BTC" when "TEST.t" until testnet changes
          'BTC'
        : item.tokenSymbol
      : ''
  ).split('.')[0]

  if (pending) {
    return {
      sourceBlockchain: item.sourceChain,
      targetBlockchain: item.targetChain
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
