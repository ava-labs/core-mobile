import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { format, isToday } from 'date-fns'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
import { SwapActivityItem } from 'new/features/notifications/types'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { Transaction } from 'store/transaction'

export type ActivityListItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'transaction'; transaction: Transaction; id: string }
  | {
      type: 'pendingBridge'
      transaction: BridgeTransaction | BridgeTransfer
      id: string
    }
  | { type: 'pendingSwap'; swapActivity: SwapActivityItem; id: string }

export function getDateGroups(transactions: Transaction[]): {
  todayTxs: Transaction[]
  monthGroups: { [key: string]: Transaction[] }
} {
  const now = new Date()
  const todayTxs: Transaction[] = []
  const monthGroups: { [key: string]: Transaction[] } = {}

  transactions.forEach(tx => {
    const txDate = new Date(tx.timestamp) // timestamp is already in milliseconds

    if (isToday(txDate)) {
      todayTxs.push(tx)
    } else {
      // Create month key for all non-today transactions
      const currentYear = now.getFullYear()
      const txYear = txDate.getFullYear()

      // Only include year if it's different from current year
      const monthKey =
        txYear !== currentYear
          ? format(txDate, 'MMMM yyyy')
          : format(txDate, 'MMMM')

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = []
      }
      monthGroups[monthKey].push(tx)
    }
  })

  return { todayTxs, monthGroups }
}

export function buildGroupedData(
  todayTxs: Transaction[],
  monthGroups: { [key: string]: Transaction[] },
  pendingBridgeTxs: (BridgeTransaction | BridgeTransfer)[],
  inProgressSwaps: SwapActivityItem[] = []
): ActivityListItem[] {
  const now = new Date()
  const flatData: ActivityListItem[] = []

  // Group in-progress swaps by date (same bucketing logic as getDateGroups)
  const todaySwaps: SwapActivityItem[] = []
  const swapMonthGroups: { [key: string]: SwapActivityItem[] } = {}

  inProgressSwaps.forEach(swap => {
    const swapDate = new Date(swap.timestamp)
    if (isToday(swapDate)) {
      todaySwaps.push(swap)
    } else {
      const currentYear = now.getFullYear()
      const swapYear = swapDate.getFullYear()
      const monthKey =
        swapYear !== currentYear
          ? format(swapDate, 'MMMM yyyy')
          : format(swapDate, 'MMMM')
      if (!swapMonthGroups[monthKey]) {
        swapMonthGroups[monthKey] = []
      }
      swapMonthGroups[monthKey].push(swap)
    }
  })

  // Add pending bridge transactions at the top
  pendingBridgeTxs.forEach(tx => {
    flatData.push({
      type: 'pendingBridge',
      transaction: tx,
      id: `pending-bridge-${tx.sourceTxHash}`
    })
  })

  // Build a date section by merging transactions and swaps, sorted by timestamp desc
  const buildMixedSection = (
    txs: Transaction[],
    swaps: SwapActivityItem[]
  ): ActivityListItem[] => {
    type Sortable =
      | { kind: 'tx'; data: Transaction; ts: number }
      | { kind: 'swap'; data: SwapActivityItem; ts: number }

    const items: Sortable[] = [
      ...txs.map(tx => ({ kind: 'tx' as const, data: tx, ts: tx.timestamp })),
      ...swaps.map(s => ({
        kind: 'swap' as const,
        data: s,
        ts: s.timestamp
      }))
    ]
    items.sort((a, b) => b.ts - a.ts)

    return items.map(item => {
      if (item.kind === 'tx') {
        return {
          type: 'transaction' as const,
          transaction: item.data,
          id: `tx-${item.data.hash}`
        }
      }
      return {
        type: 'pendingSwap' as const,
        swapActivity: item.data,
        id: `pending-swap-${item.data.transfer.id}`
      }
    })
  }

  // Add Today section
  if (todayTxs.length > 0 || todaySwaps.length > 0) {
    flatData.push({ type: 'header', title: 'Today', id: 'header-today' })
    flatData.push(...buildMixedSection(todayTxs, todaySwaps))
  }

  // Collect all month keys from both transactions and swaps
  const allMonthKeys = new Set([
    ...Object.keys(monthGroups),
    ...Object.keys(swapMonthGroups)
  ])

  const sortedMonthKeys = Array.from(allMonthKeys).sort((a, b) => {
    const dateA = new Date(`${a} 1, ${now.getFullYear()}`)
    const dateB = new Date(`${b} 1, ${now.getFullYear()}`)
    return dateB.getTime() - dateA.getTime()
  })

  sortedMonthKeys.forEach(monthKey => {
    const monthTxs = monthGroups[monthKey] ?? []
    const monthSwaps = swapMonthGroups[monthKey] ?? []
    if (monthTxs.length > 0 || monthSwaps.length > 0) {
      flatData.push({
        type: 'header',
        title: monthKey,
        id: `header-${monthKey.toLowerCase().replace(' ', '-')}`
      })
      flatData.push(...buildMixedSection(monthTxs, monthSwaps))
    }
  })

  return flatData
}

export function filterSwapBySearch(
  swap: SwapActivityItem,
  search: string
): boolean {
  const searchLower = search.toLowerCase()
  return (
    swap.transfer.sourceAsset.symbol.toLowerCase().includes(searchLower) ||
    swap.transfer.targetAsset.symbol.toLowerCase().includes(searchLower)
  )
}

export function isCollectibleTransaction(
  tx: TokenActivityTransaction
): boolean {
  return (
    ((tx.tokens[0]?.type === TokenType.ERC1155 ||
      tx.tokens[0]?.type === TokenType.ERC721) &&
      Boolean(tx.tokens[1]?.collectableTokenId)) ||
    isNftTransaction(tx)
  )
}

export function isNftTransaction(tx: TokenActivityTransaction): boolean {
  return (
    tx.txType === TransactionType.NFT_SEND ||
    tx.txType === TransactionType.NFT_RECEIVE ||
    tx.txType === TransactionType.NFT_BUY
  )
}

export function isSupportedNftChainId(chainId: number): boolean {
  return isAvalancheCChainId(chainId) || isEthereumChainId(chainId)
}

// To differentiate between swap and sent/received
// we need to check if the from and to addresses are the same
// as the from and to addresses of the token
export function isPotentiallySwap(tx: TokenActivityTransaction): boolean {
  return (
    tx.from === tx.tokens[0]?.from?.address &&
    tx.to === tx.tokens[0]?.to?.address
  )
}
