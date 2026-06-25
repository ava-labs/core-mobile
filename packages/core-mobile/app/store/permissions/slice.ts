import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { RootState } from 'store/types'
import { Address, Domain, DomainGrants, PermissionsState } from './types'

const reducerName = 'permissions'

const initialState: PermissionsState = {
  grants: {}
}

type GrantPayload = {
  domain: Domain
  address: Address
  vmType: NetworkVMType
}

type RevokePayload = {
  domain: Domain
  address?: Address
  vmType?: NetworkVMType
}

// EVM addresses vary by hex casing (checksummed vs lowercased), so they must
// match case-insensitively. Base58 (Solana) and legacy Bitcoin addresses are
// case-SENSITIVE — case-folding them could collapse two distinct addresses, so
// only EVM-shaped addresses are lowercased; everything else matches exactly.
const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/
export const canonicalizeAddress = (address: Address): Address =>
  EVM_ADDRESS_REGEX.test(address) ? address.toLowerCase() : address

const permissionsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    grantPermission: (state, action: PayloadAction<GrantPayload>) => {
      const { domain, address, vmType } = action.payload
      const domainGrants = state.grants[domain] ?? {}
      const addressGrants = domainGrants[address] ?? []
      if (!addressGrants.includes(vmType)) {
        addressGrants.push(vmType)
      }
      domainGrants[address] = addressGrants
      state.grants[domain] = domainGrants
    },
    revokePermission: (state, action: PayloadAction<RevokePayload>) => {
      const { domain, address, vmType } = action.payload
      const domainGrants = state.grants[domain]
      if (!domainGrants) return

      if (address === undefined) {
        delete state.grants[domain]
        return
      }

      const addressGrants = domainGrants[address]
      if (!addressGrants) return

      if (vmType === undefined) {
        delete domainGrants[address]
      } else {
        domainGrants[address] = addressGrants.filter(v => v !== vmType)
        if (domainGrants[address]?.length === 0) {
          delete domainGrants[address]
        }
      }

      if (Object.keys(domainGrants).length === 0) {
        delete state.grants[domain]
      }
    },
    /**
     * Revoke every grant held by any of the given addresses, across all
     * domains, pruning domains left empty. Address-oriented and VM-agnostic:
     * the caller (permissions listener) maps a removed account/wallet to its
     * per-VM addresses — the slice never imports the `Account` type.
     *
     * EVM addresses match case-insensitively (a re-cased `addressC` — e.g. a
     * SeedlessWallet-lowercased one — still matches its stored grant key,
     * consistent with the injected-provider signing gate). Case-sensitive
     * address families (Solana base58, legacy Bitcoin) match exactly. See
     * `canonicalizeAddress`. (CP-14374)
     */
    revokeAllGrantsForAddresses: (state, action: PayloadAction<Address[]>) => {
      const targets = new Set(action.payload.map(canonicalizeAddress))
      if (targets.size === 0) return
      for (const domain of Object.keys(state.grants)) {
        const domainGrants = state.grants[domain]
        if (!domainGrants) continue
        for (const address of Object.keys(domainGrants)) {
          if (targets.has(canonicalizeAddress(address))) {
            delete domainGrants[address]
          }
        }
        if (Object.keys(domainGrants).length === 0) {
          delete state.grants[domain]
        }
      }
    }
  }
})

export const selectGrantsForDomain =
  (domain: Domain) =>
  (state: RootState): DomainGrants =>
    state.permissions.grants[domain] ?? {}

export const selectHasPermission =
  ({
    domain,
    address,
    vmType
  }: {
    domain: Domain
    address: Address
    vmType: NetworkVMType
  }) =>
  (state: RootState): boolean => {
    const domainGrants = state.permissions.grants[domain]
    if (!domainGrants) return false
    const addressGrants = domainGrants[address]
    if (!addressGrants) return false
    return addressGrants.includes(vmType)
  }

export const selectConnectedDomains = (state: RootState): Domain[] =>
  Object.keys(state.permissions.grants)

export const selectAddressesForDomain =
  (domain: Domain) =>
  (state: RootState): Address[] => {
    const domainGrants = state.permissions.grants[domain]
    if (!domainGrants) return []
    return Object.keys(domainGrants)
  }

/**
 * Returns every address under `domain` that has been granted access for the
 * given `vmType`. Used by the injected provider to answer
 * `wallet_getPermissions` / `eth_requestAccounts` with the full authorized
 * set rather than only the currently-active account — so switching the
 * wallet's active account does not force the user to re-grant the dApp.
 */
export const selectGrantedAddressesForDomain =
  ({ domain, vmType }: { domain: Domain; vmType: NetworkVMType }) =>
  (state: RootState): Address[] => {
    const domainGrants = state.permissions.grants[domain]
    if (!domainGrants) return []
    const granted: Address[] = []
    for (const address of Object.keys(domainGrants)) {
      const vmTypes = domainGrants[address]
      if (vmTypes?.includes(vmType)) granted.push(address)
    }
    return granted
  }

export const {
  grantPermission,
  revokePermission,
  revokeAllGrantsForAddresses
} = permissionsSlice.actions

export const permissionsReducer = permissionsSlice.reducer
