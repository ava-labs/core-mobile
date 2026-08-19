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
const currency = 'USD'

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
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      }),
      balances('exact')
    )
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: false,
        currency
      }),
      balances('other')
    )

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      })
    ).toEqual(balances('exact'))
  })

  it('falls back to the opposite-flag key when the exact key is empty (toggle-flip window)', () => {
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: false,
        currency
      }),
      balances('pre-toggle')
    )

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      })
    ).toEqual(balances('pre-toggle'))
  })

  it('prefers an exact-key empty array (completed fetch) over the fallback', () => {
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      }),
      []
    )
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: false,
        currency
      }),
      balances('stale')
    )

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      })
    ).toEqual([])
  })

  it('returns undefined when neither key has data', () => {
    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true,
        currency
      })
    ).toBeUndefined()
  })

  it('does not return cached balances for another currency', () => {
    client.setQueryData(
      balanceKey({
        account,
        networks,
        filterOutDustUtxos: true,
        currency: 'USD'
      }),
      balances('usd')
    )

    expect(
      getCachedBalancesWithFlagFallback({
        client,
        account,
        networks,
        filterOutDustUtxos: true,
        currency: 'MXN'
      })
    ).toBeUndefined()
  })
})
