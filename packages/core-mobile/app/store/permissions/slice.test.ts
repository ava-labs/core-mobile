import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RootState } from 'store/types'
import {
  grantPermission,
  permissionsReducer,
  revokeAllGrantsForAddresses,
  revokePermission,
  selectAddressesForDomain,
  selectConnectedDomains,
  selectGrantedAddressesForDomain,
  selectGrantsForDomain,
  selectHasPermission
} from './slice'
import { PermissionsState } from './types'

const ADDR_A = '0xAAAA'
const ADDR_B = '0xBBBB'
const DOMAIN_UNI = 'https://app.uniswap.org'
const DOMAIN_OS = 'https://opensea.io'

const buildRootState = (state: PermissionsState): RootState =>
  ({ permissions: state } as unknown as RootState)

const emptyState: PermissionsState = { grants: {} }

describe('permissions slice', () => {
  describe('grantPermission', () => {
    it('creates the domain + address + vm entry from empty state', () => {
      const next = permissionsReducer(
        emptyState,
        grantPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })
      )
      expect(next.grants).toEqual({
        [DOMAIN_UNI]: {
          [ADDR_A]: [NetworkVMType.EVM]
        }
      })
    })

    it('does not duplicate an existing vm type for the same (domain, address)', () => {
      const seeded: PermissionsState = {
        grants: {
          [DOMAIN_UNI]: { [ADDR_A]: [NetworkVMType.EVM] }
        }
      }
      const next = permissionsReducer(
        seeded,
        grantPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })
      )
      expect(next.grants[DOMAIN_UNI]?.[ADDR_A]).toEqual([NetworkVMType.EVM])
    })

    it('appends a new vm type alongside an existing one', () => {
      const seeded: PermissionsState = {
        grants: {
          [DOMAIN_UNI]: { [ADDR_A]: [NetworkVMType.EVM] }
        }
      }
      const next = permissionsReducer(
        seeded,
        grantPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.SVM
        })
      )
      expect(next.grants[DOMAIN_UNI]?.[ADDR_A]).toEqual([
        NetworkVMType.EVM,
        NetworkVMType.SVM
      ])
    })

    it('supports multiple addresses per domain', () => {
      let state = emptyState
      state = permissionsReducer(
        state,
        grantPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })
      )
      state = permissionsReducer(
        state,
        grantPermission({
          domain: DOMAIN_UNI,
          address: ADDR_B,
          vmType: NetworkVMType.EVM
        })
      )
      expect(state.grants[DOMAIN_UNI]).toEqual({
        [ADDR_A]: [NetworkVMType.EVM],
        [ADDR_B]: [NetworkVMType.EVM]
      })
    })
  })

  describe('revokePermission', () => {
    const seeded: PermissionsState = {
      grants: {
        [DOMAIN_UNI]: {
          [ADDR_A]: [NetworkVMType.EVM, NetworkVMType.SVM],
          [ADDR_B]: [NetworkVMType.EVM]
        },
        [DOMAIN_OS]: {
          [ADDR_A]: [NetworkVMType.EVM]
        }
      }
    }

    it('drops only the given vm type when vmType is specified', () => {
      const next = permissionsReducer(
        seeded,
        revokePermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })
      )
      expect(next.grants[DOMAIN_UNI]?.[ADDR_A]).toEqual([NetworkVMType.SVM])
    })

    it('drops the address entry when vmType removal empties it', () => {
      const next = permissionsReducer(
        seeded,
        revokePermission({
          domain: DOMAIN_UNI,
          address: ADDR_B,
          vmType: NetworkVMType.EVM
        })
      )
      expect(next.grants[DOMAIN_UNI]?.[ADDR_B]).toBeUndefined()
      // Other address for same domain untouched
      expect(next.grants[DOMAIN_UNI]?.[ADDR_A]).toEqual([
        NetworkVMType.EVM,
        NetworkVMType.SVM
      ])
    })

    it('drops the whole address (all vm types) when vmType is omitted', () => {
      const next = permissionsReducer(
        seeded,
        revokePermission({ domain: DOMAIN_UNI, address: ADDR_A })
      )
      expect(next.grants[DOMAIN_UNI]?.[ADDR_A]).toBeUndefined()
      expect(next.grants[DOMAIN_UNI]?.[ADDR_B]).toEqual([NetworkVMType.EVM])
    })

    it('drops the whole domain when address is omitted', () => {
      const next = permissionsReducer(
        seeded,
        revokePermission({ domain: DOMAIN_UNI })
      )
      expect(next.grants[DOMAIN_UNI]).toBeUndefined()
      expect(next.grants[DOMAIN_OS]).toBeDefined()
    })

    it('drops the domain entry when removing the last address', () => {
      const single: PermissionsState = {
        grants: { [DOMAIN_OS]: { [ADDR_A]: [NetworkVMType.EVM] } }
      }
      const next = permissionsReducer(
        single,
        revokePermission({
          domain: DOMAIN_OS,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })
      )
      expect(next.grants[DOMAIN_OS]).toBeUndefined()
    })

    it('is a no-op for unknown domain / address', () => {
      const next1 = permissionsReducer(
        seeded,
        revokePermission({ domain: 'https://unknown.test' })
      )
      expect(next1).toEqual(seeded)

      const next2 = permissionsReducer(
        seeded,
        revokePermission({ domain: DOMAIN_UNI, address: '0xCCCC' })
      )
      expect(next2).toEqual(seeded)
    })
  })

  describe('revokeAllGrantsForAddresses', () => {
    const ADDR_C = '0xCCCC'
    const seeded: PermissionsState = {
      grants: {
        [DOMAIN_UNI]: {
          [ADDR_A]: [NetworkVMType.EVM, NetworkVMType.SVM],
          [ADDR_B]: [NetworkVMType.EVM]
        },
        [DOMAIN_OS]: {
          [ADDR_A]: [NetworkVMType.EVM]
        }
      }
    }

    it('removes one address everywhere and prunes domains it empties', () => {
      const next = permissionsReducer(
        seeded,
        revokeAllGrantsForAddresses([ADDR_A])
      )
      // ADDR_A gone from both domains; DOMAIN_OS pruned (it only had ADDR_A).
      expect(next.grants[DOMAIN_UNI]).toEqual({ [ADDR_B]: [NetworkVMType.EVM] })
      expect(next.grants[DOMAIN_OS]).toBeUndefined()
    })

    it('revokes multiple addresses (e.g. an account spanning VMs) in one pass', () => {
      const next = permissionsReducer(
        seeded,
        revokeAllGrantsForAddresses([ADDR_A, ADDR_B])
      )
      // Every grant for both addresses is gone → both domains pruned.
      expect(next.grants).toEqual({})
    })

    it('de-dupes the address list (shared X/P addresses) without error', () => {
      const next = permissionsReducer(
        seeded,
        revokeAllGrantsForAddresses([ADDR_A, ADDR_A])
      )
      expect(next.grants[DOMAIN_UNI]).toEqual({ [ADDR_B]: [NetworkVMType.EVM] })
      expect(next.grants[DOMAIN_OS]).toBeUndefined()
    })

    it('matches EVM grant keys case-insensitively (checksummed vs lowercased)', () => {
      const checksummed: PermissionsState = {
        grants: {
          [DOMAIN_UNI]: {
            '0xAbCdEf0000000000000000000000000000000001': [NetworkVMType.EVM]
          }
        }
      }
      const next = permissionsReducer(
        checksummed,
        revokeAllGrantsForAddresses([
          '0xabcdef0000000000000000000000000000000001'
        ])
      )
      expect(next.grants[DOMAIN_UNI]).toBeUndefined()
    })

    it('matches case-sensitive (base58 Solana / BTC) addresses exactly — no case-fold collision', () => {
      // Two DISTINCT base58 pubkeys that differ only by letter case must not
      // cross-revoke (base58 is case-sensitive). Lowercasing both would wrongly
      // collapse them.
      const svmGranted = 'So1anaPubKeyAbc111111111111111111111111111'
      const svmRemoved = 'so1anapubkeyABC111111111111111111111111111'
      const state: PermissionsState = {
        grants: { [DOMAIN_UNI]: { [svmGranted]: [NetworkVMType.SVM] } }
      }
      const next = permissionsReducer(
        state,
        revokeAllGrantsForAddresses([svmRemoved])
      )
      // The granted account's key is untouched (different address, case-sensitive).
      expect(next.grants[DOMAIN_UNI]).toEqual({
        [svmGranted]: [NetworkVMType.SVM]
      })
    })

    it('is a no-op for an address with no grants', () => {
      const next = permissionsReducer(
        seeded,
        revokeAllGrantsForAddresses([ADDR_C])
      )
      expect(next).toEqual(seeded)
    })

    it('is a no-op for an empty address list', () => {
      const next = permissionsReducer(seeded, revokeAllGrantsForAddresses([]))
      expect(next).toEqual(seeded)
    })
  })

  describe('selectors', () => {
    const state = buildRootState({
      grants: {
        [DOMAIN_UNI]: {
          [ADDR_A]: [NetworkVMType.EVM]
        },
        [DOMAIN_OS]: {
          [ADDR_B]: [NetworkVMType.EVM]
        }
      }
    })

    it('selectHasPermission returns true only for an exact (domain, address, vmType) match', () => {
      expect(
        selectHasPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })(state)
      ).toBe(true)
      expect(
        selectHasPermission({
          domain: DOMAIN_UNI,
          address: ADDR_A,
          vmType: NetworkVMType.SVM
        })(state)
      ).toBe(false)
      expect(
        selectHasPermission({
          domain: DOMAIN_UNI,
          address: ADDR_B,
          vmType: NetworkVMType.EVM
        })(state)
      ).toBe(false)
      expect(
        selectHasPermission({
          domain: 'https://unknown.test',
          address: ADDR_A,
          vmType: NetworkVMType.EVM
        })(state)
      ).toBe(false)
    })

    it('selectGrantsForDomain returns the nested grants or empty', () => {
      expect(selectGrantsForDomain(DOMAIN_UNI)(state)).toEqual({
        [ADDR_A]: [NetworkVMType.EVM]
      })
      expect(selectGrantsForDomain('https://nope.test')(state)).toEqual({})
    })

    it('selectConnectedDomains returns every domain key', () => {
      const domains = selectConnectedDomains(state)
      expect(domains).toEqual(expect.arrayContaining([DOMAIN_UNI, DOMAIN_OS]))
      expect(domains).toHaveLength(2)
    })

    it("selectAddressesForDomain returns that domain's address keys", () => {
      expect(selectAddressesForDomain(DOMAIN_UNI)(state)).toEqual([ADDR_A])
      expect(selectAddressesForDomain('https://nope.test')(state)).toEqual([])
    })

    it('selectGrantedAddressesForDomain returns addresses granted for the vmType, or [] for unknown domain', () => {
      // Shared state: DOMAIN_UNI granted ADDR_A for EVM only.
      expect(
        selectGrantedAddressesForDomain({
          domain: DOMAIN_UNI,
          vmType: NetworkVMType.EVM
        })(state)
      ).toEqual([ADDR_A])
      expect(
        selectGrantedAddressesForDomain({
          domain: DOMAIN_UNI,
          vmType: NetworkVMType.SVM
        })(state)
      ).toEqual([])
      expect(
        selectGrantedAddressesForDomain({
          domain: 'https://nope.test',
          vmType: NetworkVMType.EVM
        })(state)
      ).toEqual([])
    })

    it('selectGrantedAddressesForDomain filters by vmType across multiple addresses', () => {
      const multiState = buildRootState({
        grants: {
          [DOMAIN_UNI]: {
            [ADDR_A]: [NetworkVMType.EVM, NetworkVMType.SVM],
            [ADDR_B]: [NetworkVMType.SVM]
          }
        }
      })
      // EVM grant → only ADDR_A; SVM grant → both addresses (insertion order).
      expect(
        selectGrantedAddressesForDomain({
          domain: DOMAIN_UNI,
          vmType: NetworkVMType.EVM
        })(multiState)
      ).toEqual([ADDR_A])
      expect(
        selectGrantedAddressesForDomain({
          domain: DOMAIN_UNI,
          vmType: NetworkVMType.SVM
        })(multiState)
      ).toEqual([ADDR_A, ADDR_B])
    })
  })
})
