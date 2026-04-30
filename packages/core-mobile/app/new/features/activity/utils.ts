import { TokenType, TransactionType, TxToken } from '@avalabs/vm-module-types'
import { format, isToday } from 'date-fns'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
import { isTxSentFromAccount } from 'features/portfolio/utils'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isNftTokenType } from 'services/nft/utils'
import { Account } from 'store/account'
import { Transaction } from 'store/transaction'

export type ActivityListItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'transaction'; transaction: Transaction; id: string }

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
  monthGroups: { [key: string]: Transaction[] }
): ActivityListItem[] {
  const now = new Date()
  const flatData: ActivityListItem[] = []

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
    if (!isNftTokenType(token.type)) continue
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

// `findPaymentToken` and `resolvePaymentSymbol` only consider tokens that
// could plausibly be the payment leg of an NFT trade — NATIVE or ERC20.
export const isPaymentTokenType = (token: TxToken | undefined): boolean =>
  token?.type === TokenType.NATIVE || token?.type === TokenType.ERC20

// Resolve the symbol shown for a payment leg. Mirrors the swap-title fallback
// chain: prefer `token.symbol`, then the network token symbol when the leg is
// NATIVE (Glacier often returns empty symbol for native assets), finally
// `token.type` so we never render `"undefined"`.
export const resolvePaymentSymbol = (
  token: TxToken,
  networkTokenSymbol: string | undefined
): string => {
  if (token.symbol) return token.symbol
  if (token.type === TokenType.NATIVE && networkTokenSymbol) {
    return networkTokenSymbol
  }
  return token.type ?? ''
}

// Determines whether the active user ended up holding the NFT after the tx.
// Prefers NFT-leg from/to addresses; falls back to top-level tx flags when
// the NFT entry omits them (some Glacier responses do).
export const resolveUserIsRecipient = ({
  nftToken,
  userAddressLower,
  transaction,
  account
}: {
  nftToken: TxToken | undefined
  userAddressLower: string | undefined
  transaction: TokenActivityTransaction
  account: Account | undefined
}): boolean => {
  const nftFromLower = nftToken?.from?.address?.toLowerCase()
  const nftToLower = nftToken?.to?.address?.toLowerCase()

  if (nftToLower && nftToLower === userAddressLower) return true
  if (nftFromLower && nftFromLower === userAddressLower) return false

  return !(
    transaction.isSender || isTxSentFromAccount(transaction.from, account)
  )
}

// Picks a NATIVE/ERC20 leg matching the user's direction (payment leaves the
// user on a buy, lands at the user on a sell). When direction-based matching
// fails (some Glacier responses omit `from`/`to`), only fall back if there is
// a single unambiguous payment token — multiple payment legs without
// direction info could mislead (e.g. royalty/fee legs vs. seller payout).
export const findPaymentToken = (
  tokens: TxToken[],
  userIsRecipient: boolean,
  userAddressLower: string | undefined
): TxToken | undefined => {
  const matchesUserDirection = (token: TxToken): boolean => {
    const addr = (
      userIsRecipient ? token.from?.address : token.to?.address
    )?.toLowerCase()
    return Boolean(addr) && addr === userAddressLower
  }

  const directional = tokens.find(
    t => isPaymentTokenType(t) && matchesUserDirection(t)
  )
  if (directional) return directional

  const payments = tokens.filter(isPaymentTokenType)
  return payments.length === 1 ? payments[0] : undefined
}

// Composes a human-readable label for the NFT in the title. Uses whichever of
// `name`/`symbol` are populated and falls back to "NFT" when both are missing.
// Applies to both ERC721 and ERC1155 — ERC1155 collections like game assets
// often carry meaningful names worth surfacing.
export const getNftLabel = (nftToken: TxToken | undefined): string => {
  const name = nftToken?.name?.trim()
  const symbol = nftToken?.symbol?.trim()

  // Avoid redundant "Name (SYMBOL)" when name and symbol are effectively
  // identical (case-insensitive) — common for ERC1155 game assets where both
  // fields carry the same string.
  if (name && symbol && name.toLowerCase() !== symbol.toLowerCase()) {
    return `${name} (${symbol})`
  }
  if (name) return name
  if (symbol) return symbol
  return 'NFT'
}
