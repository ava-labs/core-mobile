import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import { SessionTypes } from '@walletconnect/types'
import { CoreAccountAddresses } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { isAvalancheSignMessageAuthorized } from './isAvalancheSignMessageAuthorized'

const X = AvalancheCaip2ChainId.X

const GRANTED_AVM = 'X-fuji1granted00000000000000000000000000000'
const UNGRANTED_AVM = 'X-fuji1ungranted000000000000000000000000000'

const account = (addressAVM: string): CoreAccountAddresses => ({
  addressC: '0xc0000000000000000000000000000000000000c0',
  addressBTC: 'bc1qbtc',
  addressCoreEth: '0xcoreeth',
  addressAVM,
  addressPVM: 'P-fuji1pvm',
  addressSVM: 'svmAddr'
})

const sessionGranting = (addresses: string[]): SessionTypes.Struct =>
  ({
    namespaces: {
      avax: {
        accounts: addresses.map(a => `${X}:${a}`),
        methods: ['avalanche_signMessage'],
        events: []
      }
    }
  } as unknown as SessionTypes.Struct)

// Explicit index 1 → an ungranted account; anything else → a granted account.
const getAccountByIndex = (index: number): CoreAccountAddresses | undefined =>
  index === 1 ? account(UNGRANTED_AVM) : account(GRANTED_AVM)

const base = {
  method: RpcMethod.AVALANCHE_SIGN_MESSAGE as string,
  isInAppRequest: false,
  params: ['hello', 1] as unknown,
  caip2ChainId: X as string,
  activeAccount: account(GRANTED_AVM),
  getAccountByIndex,
  getSession: (): SessionTypes.Struct | undefined =>
    sessionGranting([GRANTED_AVM])
}

describe('isAvalancheSignMessageAuthorized', () => {
  it('is a no-op (authorized) for any method other than avalanche_signMessage', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        method: RpcMethod.ETH_SIGN,
        // would fail closed if the guard applied, proving it is skipped
        getSession: () => {
          throw new Error('should not be consulted')
        }
      })
    ).toBe(true)
  })

  it('is a no-op (authorized) for in-app / injected-browser requests', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        isInAppRequest: true,
        getSession: () => {
          throw new Error('should not be consulted')
        }
      })
    ).toBe(true)
  })

  it('rejects when the dApp-supplied account index resolves to an ungranted account', () => {
    // params [message, 1] → getAccountByIndex(1) → UNGRANTED_AVM
    expect(isAvalancheSignMessageAuthorized(base)).toBe(false)
  })

  it('allows when the dApp-supplied account index resolves to a granted account', () => {
    expect(
      isAvalancheSignMessageAuthorized({ ...base, params: ['hello', 0] })
    ).toBe(true)
  })

  it('falls back to the active account when no index is supplied (active granted → allow)', () => {
    expect(
      isAvalancheSignMessageAuthorized({ ...base, params: ['hello'] })
    ).toBe(true)
  })

  it('falls back to the active account when no index is supplied (active ungranted → reject)', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello'],
        activeAccount: account(UNGRANTED_AVM)
      })
    ).toBe(false)
  })

  it('fails closed when no WC session exists for the topic', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', 0],
        getSession: () => undefined
      })
    ).toBe(false)
  })

  it('fails closed when getSession throws (WC client not initialized)', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', 0],
        getSession: () => {
          throw new Error('WalletConnect client is not initialized')
        }
      })
    ).toBe(false)
  })

  it('rejects a fractional index whose accounts[0] fallback is ungranted (schema allows non-integers)', () => {
    // 0.5 passes the module schema (nonnegative, not .int()); selectAccountByIndex
    // finds no match and signs with accounts[0]. The guard must check that same
    // resolved account, not the (granted) active account — else the bypass reopens.
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', 0.5],
        getAccountByIndex: () => account(UNGRANTED_AVM)
      })
    ).toBe(false)
  })

  it('allows a fractional index only when its resolved account is granted', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', 0.5],
        getAccountByIndex: () => account(GRANTED_AVM)
      })
    ).toBe(true)
  })

  it('fails closed when the account index resolves to no account', () => {
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', 5],
        getAccountByIndex: () => undefined
      })
    ).toBe(false)
  })

  it('treats an invalid (negative) index as absent and checks the active account', () => {
    // module schema rejects negatives; our resolution mirrors the "no index"
    // path (active account) rather than trusting a bogus dApp value
    expect(
      isAvalancheSignMessageAuthorized({
        ...base,
        params: ['hello', -1],
        activeAccount: account(GRANTED_AVM)
      })
    ).toBe(true)
  })
})
