import { AccountDisplayData, WalletDisplayData } from 'common/types'
import { WalletType } from 'services/wallet/types'

export type CardPos = 'single' | 'top' | 'middle' | 'bottom'

export type ListRow =
  | {
      kind: 'walletHeader'
      wallet: WalletDisplayData
      isActive: boolean
      isExpanded: boolean
      cardPos: CardPos
    }
  | {
      kind: 'account'
      account: AccountDisplayData
      cardPos: CardPos
    }
  | {
      kind: 'addAccount'
      wallet: WalletDisplayData
      cardPos: CardPos
    }

export function buildWalletListRows({
  wallets,
  expanded,
  isActiveWalletId
}: {
  wallets: WalletDisplayData[]
  expanded: Record<string, boolean>
  isActiveWalletId: (id: string) => boolean
}): ListRow[] {
  const rows: ListRow[] = []

  for (const wallet of wallets) {
    const isExpanded = expanded[wallet.id] ?? false

    if (!isExpanded) {
      rows.push({
        kind: 'walletHeader',
        wallet,
        isActive: isActiveWalletId(wallet.id),
        isExpanded: false,
        cardPos: 'single'
      })
      continue
    }

    const hasAddAccount = wallet.type !== WalletType.PRIVATE_KEY
    const hasFollowingRows = wallet.accounts.length > 0 || hasAddAccount

    rows.push({
      kind: 'walletHeader',
      wallet,
      isActive: isActiveWalletId(wallet.id),
      isExpanded: true,
      // When nothing follows the header (an expanded wallet with no accounts
      // and no Add-account row — only reachable for a PRIVATE_KEY wallet with
      // zero accounts), the header IS the whole card and must close it, so use
      // 'single' instead of 'top'. Otherwise 'top' leaves a square, unclosed
      // card with the seam-overlap margin. (WalletsScreen filters out
      // zero-account wallets upstream, but the builder stays correct on its own.)
      cardPos: hasFollowingRows ? 'top' : 'single'
    })

    wallet.accounts.forEach((account, index) => {
      const isLastAccount = index === wallet.accounts.length - 1
      const isLastRowOfCard = isLastAccount && !hasAddAccount
      rows.push({
        kind: 'account',
        account,
        cardPos: isLastRowOfCard ? 'bottom' : 'middle'
      })
    })

    if (hasAddAccount) {
      rows.push({
        kind: 'addAccount',
        wallet,
        cardPos: 'bottom'
      })
    }
  }

  return rows
}

export function listRowKey(row: ListRow): string {
  switch (row.kind) {
    case 'walletHeader':
      return `walletHeader:${row.wallet.id}`
    case 'account':
      return `account:${row.account.account.id}`
    case 'addAccount':
      return `addAccount:${row.wallet.id}`
  }
}

export function listRowType(
  row: ListRow
): 'walletHeader' | 'account' | 'addAccount' {
  return row.kind
}
