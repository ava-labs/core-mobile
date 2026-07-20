import { QueryClient } from '@tanstack/react-query'
import { Account } from 'store/account/types'
import { Network } from '@avalabs/core-chains-sdk'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import {
  balanceKey,
  getCachedBalancesWithFlagFallback
} from './useAccountBalances'

const account = { id: 'account-1' } as Account
const networks = [
  { chainId: 43114 },
  { chainId: 4503599627370475 }
] as Network[]

const balances = (marker: string): AdjustedNormalizedBalancesForAccount[] =>
  [{ accountId: 'account-1', chainId: 43114, marker }] as never

describe('getCachedBalancesWithFlagFallback', () => {
  let client: QueryClient

  beforeEach(() => {
    client = new QueryClient()
  })

  afterEach(() => {
    client.clear()
  })

  it('returns the exact-key data when present', () => {
    client.setQueryData(balanceKey(account, networks, true), balances('exact'))
    client.setQueryData(balanceKey(account, networks, false), balances('other'))

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true
      })
    ).toEqual(balances('exact'))
  })

  it('falls back to the opposite-flag key when the exact key is empty (toggle-flip window)', () => {
    client.setQueryData(
      balanceKey(account, networks, false),
      balances('pre-toggle')
    )

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true
      })
    ).toEqual(balances('pre-toggle'))
  })

  it('prefers an exact-key empty array (completed fetch) over the fallback', () => {
    client.setQueryData(balanceKey(account, networks, true), [])
    client.setQueryData(balanceKey(account, networks, false), balances('stale'))

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true
      })
    ).toEqual([])
  })

  it('returns undefined when neither key has data', () => {
    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true
      })
    ).toBeUndefined()
  })
})
