import { WalletType } from 'services/wallet/types'
import { WalletDisplayData } from 'common/types'
import {
  buildWalletListRows,
  listRowKey,
  listRowType
} from './buildWalletListRows'

const acct = (id: string, isActive = false, hideSeparator = false) =>
  ({
    wallet: { id: 'w' } as never,
    account: { id } as never,
    isActive,
    hideSeparator
  } as never)

const wallet = (
  id: string,
  accountIds: string[],
  type: WalletType = WalletType.MNEMONIC
): WalletDisplayData => ({
  id,
  name: id,
  type,
  accounts: accountIds.map(a => acct(a))
})

const noneActive = () => false

describe('buildWalletListRows', () => {
  it('collapsed wallet -> single header row only', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w1', ['a1', 'a2'])],
      expanded: { w1: false },
      isActiveWalletId: noneActive
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'walletHeader', cardPos: 'single' })
  })

  it('expanded PRIVATE_KEY wallet with no accounts -> single header (closes the card)', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('imported', [], WalletType.PRIVATE_KEY)],
      expanded: { imported: true },
      isActiveWalletId: noneActive
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      kind: 'walletHeader',
      isExpanded: true,
      cardPos: 'single'
    })
  })

  it('expanded mnemonic wallet with no accounts -> header top + addAccount bottom', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w1', [])],
      expanded: { w1: true },
      isActiveWalletId: noneActive
    })
    expect(rows.map(r => [r.kind, r.cardPos])).toEqual([
      ['walletHeader', 'top'],
      ['addAccount', 'bottom']
    ])
  })

  it('expanded mnemonic wallet -> top header, middle accounts, bottom addAccount', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w1', ['a1', 'a2'])],
      expanded: { w1: true },
      isActiveWalletId: noneActive
    })
    expect(rows.map(r => [r.kind, r.cardPos])).toEqual([
      ['walletHeader', 'top'],
      ['account', 'middle'],
      ['account', 'middle'],
      ['addAccount', 'bottom']
    ])
  })

  it('expanded PRIVATE_KEY wallet -> no addAccount row, last account is bottom', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('imported', ['a1', 'a2'], WalletType.PRIVATE_KEY)],
      expanded: { imported: true },
      isActiveWalletId: noneActive
    })
    expect(rows.map(r => [r.kind, r.cardPos])).toEqual([
      ['walletHeader', 'top'],
      ['account', 'middle'],
      ['account', 'bottom']
    ])
  })

  it('marks the active wallet header isActive', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w1', ['a1'])],
      expanded: { w1: false },
      isActiveWalletId: id => id === 'w1'
    })
    expect(rows[0]).toMatchObject({ kind: 'walletHeader', isActive: true })
  })

  it('keys and types are stable and distinct per kind', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w1', ['a1'])],
      expanded: { w1: true },
      isActiveWalletId: noneActive
    })
    expect(rows.map(listRowKey)).toEqual([
      'walletHeader:w1',
      'account:a1',
      'addAccount:w1'
    ])
    expect(rows.map(listRowType)).toEqual([
      'walletHeader',
      'account',
      'addAccount'
    ])
  })

  it('preserves input wallet order (caller pre-sorts / hoists active)', () => {
    const rows = buildWalletListRows({
      wallets: [wallet('w2', []), wallet('w1', [])],
      expanded: {},
      isActiveWalletId: noneActive
    })
    expect(
      rows.map(r => (r.kind === 'walletHeader' ? r.wallet.id : null))
    ).toEqual(['w2', 'w1'])
  })
})
