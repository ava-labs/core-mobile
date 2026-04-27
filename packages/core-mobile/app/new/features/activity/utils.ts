import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { TokenType, TransactionType, TxToken } from '@avalabs/vm-module-types'
import { format, isToday } from 'date-fns'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
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
  pendingBridgeTxs: (BridgeTransaction | BridgeTransfer)[] = []
): ActivityListItem[] {
  const now = new Date()
  const flatData: ActivityListItem[] = []

  // Add pending bridge transactions at the top
  pendingBridgeTxs.forEach(tx => {
    flatData.push({
      type: 'pendingBridge',
      transaction: tx,
      id: `pending-bridge-${tx.sourceTxHash}`
    })
  })

  // Add Today section
  if (todayTxs.length > 0) {
    flatData.push({ type: 'header', title: 'Today', id: 'header-today' })
    todayTxs.forEach(tx => {
      flatData.push({
        type: 'transaction',
        transaction: tx,
        id: `tx-${tx.hash}`
      })
    })
  }

  // Add month sections
  const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
    const dateA = new Date(`${a} 1, ${now.getFullYear()}`)
    const dateB = new Date(`${b} 1, ${now.getFullYear()}`)
    return dateB.getTime() - dateA.getTime()
  })

  sortedMonthKeys.forEach(monthKey => {
    const monthData = monthGroups[monthKey]
    if (monthData && monthData.length > 0) {
      flatData.push({
        type: 'header',
        title: monthKey,
        id: `header-${monthKey.toLowerCase().replace(' ', '-')}`
      })
      monthData.forEach(tx => {
        flatData.push({
          type: 'transaction',
          transaction: tx,
          id: `tx-${tx.hash}`
        })
      })
    }
  })

  return flatData
}

const isNftTokenType = (token: TxToken | undefined): boolean =>
  token?.type === TokenType.ERC721 || token?.type === TokenType.ERC1155

// Returns an ERC721/ERC1155 token from the transaction, regardless of its
// position in `tokens[]`. NFT purchases through marketplaces typically place
// the paid token (NATIVE/ERC20) at index 0 and the NFT at index 1, so we
// cannot rely on `tokens[0]` alone. When multiple NFT entries are present
// (some Glacier responses include both a transfer log and a token entry),
// prefer the one that carries `collectableTokenId` so callers can fetch
// metadata correctly.
export function findNftToken(
  tx: TokenActivityTransaction
): TxToken | undefined {
  let firstNft: TxToken | undefined
  for (const token of tx.tokens) {
    if (!isNftTokenType(token)) continue
    if (token.collectableTokenId) return token
    firstNft = firstNft ?? token
  }
  return firstNft
}

export function isCollectibleTransaction(
  tx: TokenActivityTransaction
): boolean {
  if (isNftTransaction(tx)) return true

  // Respect explicit non-NFT classifications from the backend so that swaps
  // routed through pools that incidentally include an NFT leg (rare) do not
  // get reclassified as collectibles.
  if (tx.txType === TransactionType.SWAP) return false

  // Covers both single-NFT transfers and the legacy paired-NFT pattern
  // (an NFT entry with `collectableTokenId` will be picked regardless of
  // its index in `tokens[]`).
  return Boolean(findNftToken(tx))
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
