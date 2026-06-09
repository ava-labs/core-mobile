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

export const { grantPermission, revokePermission } = permissionsSlice.actions

export const permissionsReducer = permissionsSlice.reducer
