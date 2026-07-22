# My Wallets — Flatten the Accordion into a Virtualized List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-wallet `WalletCard` (which renders all of a wallet's accounts inside one FlashList cell) with a flat, mixed-item virtualized list so account rows are individually virtualized — fixing both the slow performance and the on-device/Release card overlap on the "My wallets" screen.

**Architecture:** `WalletsScreen` builds a flat `ListRow[]` (`walletHeader` | `account` | `addAccount`) from the existing `walletsDisplayData` + `expandedWallets`. Each row is its own FlashList cell rendered via `ListScreenV2`, typed with `getItemType` per kind. A `CardRow` wrapper recreates the current grouped-card visuals from a per-row `cardPos`. Expand/collapse animates row insert/remove via Reanimated, with an instant-reveal fallback.

**Tech Stack:** React Native 0.85 (New Arch/Fabric), Expo 56, `@shopify/flash-list` 2.3.0, `react-native-reanimated` 4.4.1, `@avalabs/k2-alpine`, Jest.

## Global Constraints

- Commits on this repo are **SSH-signed**; run commit steps in an environment where the signing passphrase is available (an unattended shell will hang on the prompt).
- Do not use `fontWeight` to thicken Inter text — use the matching `Inter-*` `fontFamily` (see `docs/styles.md`). Not expected to arise here (no new text weights), but preserve any existing weights verbatim when moving JSX.
- Keep visuals **pixel-identical** to the current card design (corners, borders, insets, spacing, separators).
- Scope is limited to the wallets feature (`app/new/features/wallets/**`) plus deleting `app/new/common/components/WalletCard.tsx`. Do not touch other screens.
- Existing behavior to preserve: active wallet hoisted to top, imported private-key accounts shown as the virtual wallet, `hideSeparator` logic, `PRIVATE_KEY` wallets have **no** "Add account" row.
- Verify with `./node_modules/.bin/tsc --noEmit` (exit 0) and `./node_modules/.bin/eslint <file>` (exit 0) from `packages/core-mobile` after each task. Run unit tests with `./node_modules/.bin/jest <path>` (the `yarn` wrapper may be unavailable).

---

## File Structure

- Create `app/new/features/wallets/utils/buildWalletListRows.ts` — pure builder + `ListRow`/`CardPos` types. (Task 1)
- Create `app/new/features/wallets/utils/buildWalletListRows.test.ts` — unit tests. (Task 1)
- Create `app/new/features/wallets/components/CardRow.tsx` — position-based card wrapper. (Task 2)
- Create `app/new/features/wallets/components/WalletHeaderRow.tsx` — wallet header row + `WalletMoreMenu` (moved from `WalletCard`). (Task 3)
- Create `app/new/features/wallets/components/AccountRow.tsx` — account row (own balance compute + animation, wraps `AccountListItem` in `CardRow`). (Task 4)
- Create `app/new/features/wallets/components/AddAccountRow.tsx` — "Add account" row + `AddAccountButton` (moved from `WalletCard`). (Task 5)
- Modify `app/new/features/wallets/screens/WalletsScreen.tsx` — build rows, render by kind, `getItemType`, `LinearTransition`. (Task 6)
- Delete `app/new/common/components/WalletCard.tsx`. (Task 7)

---

## Task 1: Pure flat-array builder (`buildWalletListRows`)

**Files:**
- Create: `app/new/features/wallets/utils/buildWalletListRows.ts`
- Test: `app/new/features/wallets/utils/buildWalletListRows.test.ts`

**Interfaces:**
- Consumes: `WalletDisplayData`, `AccountDisplayData` from `common/types`; `WalletType` from `services/wallet/types`.
- Produces:
  - `type CardPos = 'single' | 'top' | 'middle' | 'bottom'`
  - `type ListRow = { kind: 'walletHeader'; wallet: WalletDisplayData; isActive: boolean; isExpanded: boolean; cardPos: CardPos } | { kind: 'account'; account: AccountDisplayData; cardPos: CardPos } | { kind: 'addAccount'; wallet: WalletDisplayData; cardPos: CardPos }`
  - `function buildWalletListRows(params: { wallets: WalletDisplayData[]; expanded: Record<string, boolean>; isActiveWalletId: (id: string) => boolean }): ListRow[]`
  - `function listRowKey(row: ListRow): string`
  - `function listRowType(row: ListRow): 'walletHeader' | 'account' | 'addAccount'`

- [ ] **Step 1: Write the failing tests**

```ts
// app/new/features/wallets/utils/buildWalletListRows.test.ts
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
    expect(rows.map(r => (r.kind === 'walletHeader' ? r.wallet.id : null))).toEqual([
      'w2',
      'w1'
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `./node_modules/.bin/jest app/new/features/wallets/utils/buildWalletListRows.test.ts`
Expected: FAIL — `Cannot find module './buildWalletListRows'`.

- [ ] **Step 3: Write the implementation**

```ts
// app/new/features/wallets/utils/buildWalletListRows.ts
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
  | { kind: 'account'; account: AccountDisplayData; cardPos: CardPos }
  | { kind: 'addAccount'; wallet: WalletDisplayData; cardPos: CardPos }

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

    rows.push({
      kind: 'walletHeader',
      wallet,
      isActive: isActiveWalletId(wallet.id),
      isExpanded: true,
      cardPos: 'top'
    })

    const hasAddAccount = wallet.type !== WalletType.PRIVATE_KEY

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
      rows.push({ kind: 'addAccount', wallet, cardPos: 'bottom' })
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `./node_modules/.bin/jest app/new/features/wallets/utils/buildWalletListRows.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/new/features/wallets/utils/buildWalletListRows.ts app/new/features/wallets/utils/buildWalletListRows.test.ts
git commit -m "feat(wallets): add flat list-row builder for My wallets"
```

---

## Task 2: `CardRow` — position-based card wrapper

**Files:**
- Create: `app/new/features/wallets/components/CardRow.tsx`

**Interfaces:**
- Consumes: `CardPos` from `../utils/buildWalletListRows`; `useTheme`, `View` from `@avalabs/k2-alpine`.
- Produces: `CardRow` — `({ cardPos, children }: { cardPos: CardPos; children: React.ReactNode }) => JSX.Element`.

Reproduces today's grouped-card look: horizontal inset 16, 1px border (`$borderPrimary`), 16px radius on the outer corners of a card run, `$surfacePrimary` background, and the 5px vertical spacing between cards (top on the first row of a run, bottom on the last). These values are copied from the current `WalletsScreen` `cardStyle` (`marginHorizontal: 16`, `marginVertical: 5`, `backgroundColor: $surfacePrimary`, `borderColor: $borderPrimary`, `borderWidth: 1`) and the `WalletCard` root (`borderRadius: 16`).

- [ ] **Step 1: Write the implementation**

```tsx
// app/new/features/wallets/components/CardRow.tsx
import { useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { CardPos } from '../utils/buildWalletListRows'

const RADIUS = 16
const INSET = 16
const GAP = 5

export const CardRow = ({
  cardPos,
  children
}: {
  cardPos: CardPos
  children: React.ReactNode
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const isTop = cardPos === 'top' || cardPos === 'single'
  const isBottom = cardPos === 'bottom' || cardPos === 'single'

  const style: StyleProp<ViewStyle> = {
    marginHorizontal: INSET,
    backgroundColor: colors.$surfacePrimary,
    borderColor: colors.$borderPrimary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: isTop ? 1 : 0,
    borderBottomWidth: isBottom ? 1 : 0,
    borderTopLeftRadius: isTop ? RADIUS : 0,
    borderTopRightRadius: isTop ? RADIUS : 0,
    borderBottomLeftRadius: isBottom ? RADIUS : 0,
    borderBottomRightRadius: isBottom ? RADIUS : 0,
    marginTop: isTop ? GAP : 0,
    marginBottom: isBottom ? GAP : 0,
    overflow: 'hidden'
  }

  return <View style={style}>{children}</View>
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint app/new/features/wallets/components/CardRow.tsx`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/new/features/wallets/components/CardRow.tsx
git commit -m "feat(wallets): add CardRow position-based card wrapper"
```

---

## Task 3: `WalletHeaderRow` (header row + moved `WalletMoreMenu`)

**Files:**
- Create: `app/new/features/wallets/components/WalletHeaderRow.tsx`
- Reference (source of moved code): `app/new/common/components/WalletCard.tsx`

**Interfaces:**
- Consumes: `CardRow`, `CardPos`; `WalletDisplayData` from `common/types`; existing `WalletBalance`, `WalletIcon`, `DropdownMenu`, `useManageWallet`, `useWalletBalances`, `getEnabledNetworksForAccount`, network/portfolio/settings selectors, `useFocusedSelector`.
- Produces: `WalletHeaderRow` —
  `React.memo(({ wallet, isActive, isExpanded, isRefreshing, cardPos, showMoreButton?, onToggleExpansion }: { wallet: WalletDisplayData; isActive: boolean; isExpanded: boolean; isRefreshing: boolean; cardPos: CardPos; showMoreButton?: boolean; onToggleExpansion: (walletId: string) => void }) => JSX.Element)`

**Notes:** The header keeps `useWalletBalances(accountIds)` + the existing `WalletBalance` component to show the wallet total. There is one header per wallet (few), so this is O(wallets), not O(accounts) — the win is that account rows are no longer mounted here. The header contains no account list.

- [ ] **Step 1: Write the implementation**

Move the header markup and the `WalletMoreMenu` component out of `WalletCard.tsx` verbatim, wrap the header body in `CardRow`, and drive the chevron/press from props. Full file:

```tsx
// app/new/features/wallets/components/WalletHeaderRow.tsx
import {
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import { WalletBalance } from 'features/wallets/components/WalletBalance'
import React, { useCallback, useMemo } from 'react'
import { WalletType } from 'services/wallet/types'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectIsWalletLedger } from 'store/wallet/slice'
import { useSelector } from 'react-redux'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { WalletIcon } from 'common/components/WalletIcon'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const HEADER_HEIGHT = 64

const WalletHeaderRow = ({
  wallet,
  isActive,
  isExpanded,
  isRefreshing,
  cardPos,
  showMoreButton = true,
  onToggleExpansion
}: {
  wallet: WalletDisplayData
  isActive: boolean
  isExpanded: boolean
  isRefreshing: boolean
  cardPos: CardPos
  showMoreButton?: boolean
  onToggleExpansion: (walletId: string) => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const accountIds = useMemo(
    () => wallet.accounts.map(a => a.account.id),
    [wallet.accounts]
  )
  const { data: walletBalancesData, isError: isBalancesError } =
    useWalletBalances(accountIds)

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  const enabledNetworksCountByAccount = useMemo(() => {
    const result: Record<string, number> = {}
    for (const item of wallet.accounts) {
      result[item.account.id] = getEnabledNetworksForAccount(
        item.account,
        enabledNetworks
      ).length
    }
    return result
  }, [wallet.accounts, enabledNetworks])

  const handleToggle = useCallback(() => {
    onToggleExpansion(wallet.id)
  }, [onToggleExpansion, wallet.id])

  const balanceSx = useMemo(
    () => ({
      color: isActive ? colors.$textPrimary : colors.$textSecondary
    }),
    [isActive, colors.$textPrimary, colors.$textSecondary]
  )

  return (
    <CardRow cardPos={cardPos}>
      <TouchableOpacity
        onPress={handleToggle}
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: HEADER_HEIGHT,
          gap: 12
        }}>
        <View
          sx={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              paddingLeft: 5
            }}>
            <Icons.Navigation.ChevronRight
              color={colors.$textSecondary}
              width={20}
              height={20}
              transform={[{ rotate: isExpanded ? '-90deg' : '90deg' }]}
            />
            <WalletIcon wallet={wallet} isExpanded={isExpanded} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              flex: 1
            }}>
            <View style={{ flex: 1 }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  testID={`manage_accounts_wallet_name__${wallet.name}`}
                  variant="heading4"
                  style={{ lineHeight: 27, flexShrink: 1 }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {wallet.name}
                </Text>
                {isActive && (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: colors.$textSuccess,
                      borderRadius: 100
                    }}
                  />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.$textSecondary
                }}>
                {(() => {
                  const accountCountText =
                    wallet.accounts.length > 1
                      ? `${wallet.accounts.length} accounts`
                      : '1 account'
                  const derivationPathLabel =
                    wallet.type === WalletType.LEDGER
                      ? LedgerDerivationPathType.BIP44
                      : wallet.type === WalletType.LEDGER_LIVE
                      ? LedgerDerivationPathType.LedgerLive
                      : null
                  return derivationPathLabel
                    ? `${derivationPathLabel} – ${accountCountText}`
                    : accountCountText
                })()}
              </Text>
            </View>
          </View>
        </View>

        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: showMoreButton ? 0 : 24
          }}>
          <WalletBalance
            balanceSx={balanceSx}
            isRefreshing={isRefreshing}
            walletBalancesData={walletBalancesData}
            isBalancesError={isBalancesError}
            enabledNetworksCountByAccount={enabledNetworksCountByAccount}
            enabledNetworksMap={enabledNetworksMap}
            enabledChainIds={enabledChainIds}
            isDeveloperMode={isDeveloperMode}
            tokenVisibility={tokenVisibility}
          />
          {showMoreButton && <WalletMoreMenu wallet={wallet} />}
        </View>
      </TouchableOpacity>
    </CardRow>
  )
}

const WalletMoreMenu = React.memo(
  ({ wallet }: { wallet: WalletDisplayData }) => {
    const {
      theme: { colors }
    } = useTheme()
    const selectLedger = useMemo(
      () => selectIsWalletLedger(wallet.id),
      [wallet.id]
    )
    const isLedger = useSelector(selectLedger)
    const { getDropdownItems, handleDropdownSelect } = useManageWallet()

    return (
      <DropdownMenu
        testID={`more_icon__${wallet.name}`}
        groups={[
          { key: 'wallet-actions', items: getDropdownItems(wallet, isLedger) }
        ]}
        onPressAction={(event: { nativeEvent: { event: string } }) =>
          handleDropdownSelect(event.nativeEvent.event, wallet)
        }>
        <TouchableOpacity
          style={{
            minHeight: HEADER_HEIGHT,
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}>
          <View
            style={{ minWidth: 54, paddingRight: 21, alignItems: 'flex-end' }}>
            <Icons.Navigation.MoreHoriz
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          </View>
        </TouchableOpacity>
      </DropdownMenu>
    )
  }
)

function arePropsEqual(
  prev: React.ComponentProps<typeof WalletHeaderRow>,
  next: React.ComponentProps<typeof WalletHeaderRow>
): boolean {
  return (
    prev.isActive === next.isActive &&
    prev.isExpanded === next.isExpanded &&
    prev.isRefreshing === next.isRefreshing &&
    prev.cardPos === next.cardPos &&
    prev.showMoreButton === next.showMoreButton &&
    prev.onToggleExpansion === next.onToggleExpansion &&
    prev.wallet === next.wallet
  )
}

export default React.memo(WalletHeaderRow, arePropsEqual)
```

> Note: `DropdownMenu` and `WalletIcon` currently import from `./DropdownMenu` / `./WalletIcon` inside `common/components/WalletCard.tsx`. From this new file, import them from `common/components/DropdownMenu` and `common/components/WalletIcon` (verify those paths resolve; adjust to the actual export path if it differs).

- [ ] **Step 2: Typecheck + lint**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint app/new/features/wallets/components/WalletHeaderRow.tsx`
Expected: exit 0. (Note: `WalletCard.tsx` still exists and still defines its own `WalletMoreMenu`; that is fine — it is deleted in Task 7.)

- [ ] **Step 3: Commit**

```bash
git add app/new/features/wallets/components/WalletHeaderRow.tsx
git commit -m "feat(wallets): add WalletHeaderRow (extracted from WalletCard)"
```

---

## Task 4: `AccountRow` (own balance compute + insert/remove animation)

**Files:**
- Create: `app/new/features/wallets/components/AccountRow.tsx`

**Interfaces:**
- Consumes: `CardRow`, `CardPos`; existing `AccountListItem` (default? — it is exported as `{ AccountListItem }`, a named export); `AccountDisplayData` from `common/types`; `computeAccountBalance` + `AccountBalanceData` from `features/portfolio/utils/computeAccountBalance`; `useWalletBalances`; network/portfolio/settings selectors; `getEnabledNetworksForAccount`; Reanimated.
- Produces: `AccountRow` —
  `React.memo(({ account, cardPos, isRefreshing, onSetActiveAccount, onAccountDetails }: { account: AccountDisplayData; cardPos: CardPos; isRefreshing: boolean; onSetActiveAccount: (accountId: string) => void; onAccountDetails: (accountId: string) => void }) => JSX.Element)`

**Notes:** Balance is computed **per account row** (only mounted/visible rows compute). Each row observes the shared balances cache for its single account id via `useWalletBalances([account.account.id])`, then runs `computeAccountBalance`. The row content is wrapped in an `Animated.View` with `entering`/`exiting` for the expand/collapse motion; `AccountListItem` is unchanged.

- [ ] **Step 1: Write the implementation**

```tsx
// app/new/features/wallets/components/AccountRow.tsx
import { useTheme } from '@avalabs/k2-alpine'
import { AccountDisplayData } from 'common/types'
import { AccountListItem } from 'features/wallets/components/AccountListItem'
import { computeAccountBalance } from 'features/portfolio/utils/computeAccountBalance'
import { getEnabledNetworksForAccount } from 'features/portfolio/utils/getEnabledNetworksForAccount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import {
  selectEnabledChainIds,
  selectEnabledNetworks,
  selectEnabledNetworksMap
} from 'store/network/slice'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const AccountRow = ({
  account,
  cardPos,
  isRefreshing,
  onSetActiveAccount,
  onAccountDetails
}: {
  account: AccountDisplayData
  cardPos: CardPos
  isRefreshing: boolean
  onSetActiveAccount: (accountId: string) => void
  onAccountDetails: (accountId: string) => void
}): React.JSX.Element => {
  const accountId = account.account.id
  const accountIds = useMemo(() => [accountId], [accountId])
  const { data: walletBalancesData, isError: isBalancesError } =
    useWalletBalances(accountIds)

  const enabledNetworks = useSelector(selectEnabledNetworks)
  const enabledNetworksMap = useSelector(selectEnabledNetworksMap)
  const enabledChainIds = useFocusedSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  const balanceData = useMemo(() => {
    const enabledNetworksCount = getEnabledNetworksForAccount(
      account.account,
      enabledNetworks
    ).length
    return computeAccountBalance({
      accountBalances: walletBalancesData[accountId] ?? [],
      enabledNetworksCount,
      enabledNetworksMap,
      enabledChainIds,
      isDeveloperMode,
      tokenVisibility,
      isError: isBalancesError
    })
  }, [
    account.account,
    enabledNetworks,
    walletBalancesData,
    accountId,
    enabledNetworksMap,
    enabledChainIds,
    isDeveloperMode,
    tokenVisibility,
    isBalancesError
  ])

  return (
    <CardRow cardPos={cardPos}>
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <AccountListItem
          testID={`manage_accounts_list__${account.wallet.name}__${account.account.name}`}
          displayData={account}
          isRefreshing={isRefreshing}
          balanceData={balanceData}
          onSetActiveAccount={onSetActiveAccount}
          onAccountDetails={onAccountDetails}
        />
      </Animated.View>
    </CardRow>
  )
}

function arePropsEqual(
  prev: React.ComponentProps<typeof AccountRow>,
  next: React.ComponentProps<typeof AccountRow>
): boolean {
  return (
    prev.cardPos === next.cardPos &&
    prev.isRefreshing === next.isRefreshing &&
    prev.onSetActiveAccount === next.onSetActiveAccount &&
    prev.onAccountDetails === next.onAccountDetails &&
    prev.account.account.id === next.account.account.id &&
    prev.account.account.name === next.account.account.name &&
    prev.account.isActive === next.account.isActive &&
    prev.account.hideSeparator === next.account.hideSeparator
  )
}

export default React.memo(AccountRow, arePropsEqual)
```

> Note: confirm `AccountListItem` is exported as a named export (`export const AccountListItem` / `export { AccountListItem }`). The current `WalletCard` imports it as `{ AccountListItem }`, so the named import above is correct.

- [ ] **Step 2: Typecheck + lint**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint app/new/features/wallets/components/AccountRow.tsx`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/new/features/wallets/components/AccountRow.tsx
git commit -m "feat(wallets): add AccountRow with per-row balance + animation"
```

---

## Task 5: `AddAccountRow` (moved `AddAccountButton`)

**Files:**
- Create: `app/new/features/wallets/components/AddAccountRow.tsx`

**Interfaces:**
- Consumes: `CardRow`, `CardPos`; `WalletDisplayData`; `useManageWallet`; `Button`, `ActivityIndicator`, `Icons`, `useTheme`, `View` from `@avalabs/k2-alpine`; Reanimated.
- Produces: `AddAccountRow` — `React.memo(({ wallet, cardPos }: { wallet: WalletDisplayData; cardPos: CardPos }) => JSX.Element)`

- [ ] **Step 1: Write the implementation**

Move `AddAccountButton` from `WalletCard.tsx` verbatim and wrap it with the same padding the accounts container used (`paddingHorizontal: 10`, `paddingBottom: 10`, `paddingTop: 10`) inside a `CardRow`, animated like account rows.

```tsx
// app/new/features/wallets/components/AddAccountRow.tsx
import {
  ActivityIndicator,
  Button,
  Icons,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import React from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { CardPos } from '../utils/buildWalletListRows'
import { CardRow } from './CardRow'

const AddAccountRow = ({
  wallet,
  cardPos
}: {
  wallet: WalletDisplayData
  cardPos: CardPos
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { handleAddAccount, isAddingAccount } = useManageWallet()

  return (
    <CardRow cardPos={cardPos}>
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <View
          sx={{
            paddingHorizontal: 10,
            paddingTop: 10,
            paddingBottom: 10
          }}>
          <Button
            size="medium"
            leftIcon={
              isAddingAccount ? undefined : (
                <Icons.Content.Add
                  color={colors.$textPrimary}
                  width={24}
                  height={24}
                />
              )
            }
            type="secondary"
            disabled={isAddingAccount}
            testID={`add_account_btn__${wallet.name}`}
            onPress={() => handleAddAccount(wallet)}>
            {isAddingAccount ? (
              <ActivityIndicator size="small" color={colors.$textPrimary} />
            ) : (
              'Add account'
            )}
          </Button>
        </View>
      </Animated.View>
    </CardRow>
  )
}

export default React.memo(AddAccountRow)
```

- [ ] **Step 2: Typecheck + lint**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint app/new/features/wallets/components/AddAccountRow.tsx`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/new/features/wallets/components/AddAccountRow.tsx
git commit -m "feat(wallets): add AddAccountRow (extracted from WalletCard)"
```

---

## Task 6: Wire `WalletsScreen` to the flat list

**Files:**
- Modify: `app/new/features/wallets/screens/WalletsScreen.tsx`

**Interfaces:**
- Consumes: `buildWalletListRows`, `listRowKey`, `listRowType`, `ListRow` from `../utils/buildWalletListRows`; `WalletHeaderRow`, `AccountRow`, `AddAccountRow`.
- Produces: (screen — no exported interface change).

**Behavior:** Replace the single-`WalletCard` `renderItem` with a flat-row renderer. `data` becomes `buildWalletListRows(...)`. Add `keyExtractor={listRowKey}` and `getItemType={listRowType}`. Do NOT add `itemLayoutAnimation` (it does not exist in FlashList v2 — reflow is handled by FlashList itself and the per-row `entering`/`exiting`). Keep the existing `walletsDisplayData`, `expandedWallets`, `toggleWalletExpansion`, `handleSetActiveAccount`, `gotoAccountDetails`, `isActiveWalletId`, refresh, and header logic.

- [ ] **Step 1: Update imports**

Remove:
```tsx
import WalletCard from 'common/components/WalletCard'
```
Add:
```tsx
import WalletHeaderRow from 'features/wallets/components/WalletHeaderRow'
import AccountRow from 'features/wallets/components/AccountRow'
import AddAccountRow from 'features/wallets/components/AddAccountRow'
import {
  buildWalletListRows,
  listRowKey,
  listRowType,
  ListRow
} from 'features/wallets/utils/buildWalletListRows'
```

> FlashList v2 (2.3.0) has **no** `itemLayoutAnimation` prop (that was FlashList v1). Do not add it. Expand/collapse motion comes solely from the per-row `entering`/`exiting` (`FadeIn`/`FadeOut`) on `AccountRow`/`AddAccountRow`; FlashList v2 handles sibling reflow itself as `data` changes.

- [ ] **Step 2: Replace the data + renderItem + key/type wiring**

Replace the existing `renderItem` (the `useCallback` returning `<WalletCard .../>`), the `keyExtractor`, and the `getItemType` block with:

```tsx
  const rows = useMemo(
    () =>
      buildWalletListRows({
        wallets: walletsDisplayData,
        expanded: expandedWallets,
        isActiveWalletId
      }),
    [walletsDisplayData, expandedWallets, isActiveWalletId]
  )

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      switch (item.kind) {
        case 'walletHeader':
          return (
            <WalletHeaderRow
              wallet={item.wallet}
              isActive={item.isActive}
              isExpanded={item.isExpanded}
              isRefreshing={isRefreshing}
              cardPos={item.cardPos}
              onToggleExpansion={toggleWalletExpansion}
            />
          )
        case 'account':
          return (
            <AccountRow
              account={item.account}
              cardPos={item.cardPos}
              isRefreshing={isRefreshing}
              onSetActiveAccount={handleSetActiveAccount}
              onAccountDetails={gotoAccountDetails}
            />
          )
        case 'addAccount':
          return <AddAccountRow wallet={item.wallet} cardPos={item.cardPos} />
      }
    },
    [
      isRefreshing,
      toggleWalletExpansion,
      handleSetActiveAccount,
      gotoAccountDetails
    ]
  )

  const keyExtractor = useCallback((item: ListRow) => listRowKey(item), [])
  const getItemType = useCallback((item: ListRow) => listRowType(item), [])
```

- [ ] **Step 3: Update the `ListScreenV2` props**

Change `data` and `extraData` (note: no `itemLayoutAnimation` — unsupported in FlashList v2):

```tsx
    <ListScreenV2
      flatListRef={listRef}
      title="My wallets"
      subtitle={`An overview of your wallets\nand associated accounts`}
      data={rows}
      extraData={expandedWallets}
      backgroundColor={isDark ? '#121213' : '#F1F1F4'}
      renderHeader={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          progressViewOffset={progressViewOffset}
        />
      }
      progressViewOffset={progressViewOffset}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      shouldShowStickyHeader={false}
    />
```

> Reflow on toggle is handled by FlashList v2 itself as `data` changes; the visible motion is the per-row `FadeIn`/`FadeOut`. If on-device this reads as too abrupt, that is addressed in Task 8 (accept it, or fall back to instant by removing `entering`/`exiting`).

- [ ] **Step 4: Delete the now-unused `cardStyle` and `renderItem` remnants**

Remove the `cardStyle` `useMemo` (its border/margin/radius values now live in `CardRow`) and any now-unused imports (`WalletType` only if it becomes unused — it is still used by `importedWallets`/`primaryWallets` filters, so keep it).

- [ ] **Step 5: Typecheck + lint**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint app/new/features/wallets/screens/WalletsScreen.tsx`
Expected: exit 0.

- [ ] **Step 6: Run existing wallets/unit tests**

Run: `./node_modules/.bin/jest app/new/features/wallets`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/new/features/wallets/screens/WalletsScreen.tsx app/new/common/components/ListScreenV2.tsx
git commit -m "feat(wallets): render My wallets as a flat virtualized list"
```

---

## Task 7: Retire `WalletCard`

**Files:**
- Delete: `app/new/common/components/WalletCard.tsx`

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "WalletCard" app | grep -v "WalletHeaderRow\|WalletCard.tsx:"`
Expected: no matches (only comments/history, if any — remove stale comment references too).

- [ ] **Step 2: Delete the file**

```bash
git rm app/new/common/components/WalletCard.tsx
```

- [ ] **Step 3: Typecheck + lint the package**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(wallets): remove WalletCard (replaced by flat list rows)"
```

---

## Task 8: On-simulator verification (the real acceptance test)

**Files:** none (manual verification against the reproduction).

This bug is device/Release-sensitive and only recently reproduces on the simulator. Verify against the same repro used on 2026-07-02 (a wallet with several accounts + at least two other wallets).

- [ ] **Step 1: Build & run**

Run the app on the iOS simulator (`yarn ios` or the project's run flow). Prefer a **Release** configuration if feasible, since the overlap was Release-sensitive.

- [ ] **Step 2: Overlap checks**

- Expand the top (active) wallet; scroll up/down repeatedly. Confirm the collapsed wallet cards below never render on top of the expanded account rows.
- Switch the active account/wallet and re-open the screen; confirm no overlap after the reorder.

- [ ] **Step 3: Virtualization / perf check**

- With a wallet of many accounts expanded, confirm scrolling is smooth.
- Optional: temporarily add a `console.log('mount', account.account.id)` in `AccountRow` and confirm only on-screen rows mount (off-screen rows do not), then remove the log.

- [ ] **Step 4: Animation check + fallback decision**

- Toggle wallets; confirm rows animate in/out smoothly with no flicker/overlap.
- If the animation is janky or reintroduces overlap on Fabric: remove the `entering`/`exiting` props (and the `Animated.View` wrapper) from `AccountRow`/`AddAccountRow` for an instant reveal, re-verify, and commit that as the shipped behavior.

- [ ] **Step 5: Visual parity check**

- Compare against the current design: card corners, borders, inter-card spacing, account separators, active-account highlight, "Add account" button. Confirm pixel parity.

- [ ] **Step 6: Final commit (if fallback applied)**

```bash
git add -A
git commit -m "fix(wallets): finalize expand/collapse motion after on-device verification"
```

---

## Self-Review Notes (author)

- **Spec coverage:** data model + builder (Task 1), pixel-match card (Task 2 `CardRow` + Tasks 3–5), animation + fallback (Tasks 4–6, 8), balance moved per-row + header total per-wallet (Tasks 3–4), scope contained + `WalletCard` retired (Task 7), success criteria (Task 8), builder unit tests (Task 1). All spec sections mapped.
- **Deviation:** spec said compute the wallet-header total "at the screen level"; the plan keeps `useWalletBalances` inside `WalletHeaderRow` instead. Same intent (the O(accounts) cost that mattered was mounting the account rows, now virtualized); header totals are O(wallets) and few. If a stricter reading is required, hoist the totals into `WalletsScreen` and pass them down — but that adds plumbing for no measured benefit.
- **Type consistency:** `ListRow`, `CardPos`, `listRowKey`, `listRowType`, `buildWalletListRows`, `CardRow`, `WalletHeaderRow`, `AccountRow`, `AddAccountRow` names/signatures are consistent across tasks.
- **Confirmed before finalizing:** `AccountListItem` is a named export (`export { MemoizedAccountListItem as AccountListItem }`); `DropdownMenu` (`common/components/DropdownMenu`) and `WalletIcon` (`common/components/WalletIcon`) are named exports at those paths; FlashList v2 has **no** `itemLayoutAnimation` (removed from the plan — motion is per-row `entering`/`exiting` only).
