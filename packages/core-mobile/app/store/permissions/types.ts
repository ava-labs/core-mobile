import type { NetworkVMType } from '@avalabs/core-chains-sdk'

export type Domain = string
export type Address = string

export type DomainGrants = {
  [address: Address]: NetworkVMType[]
}

export type PermissionsState = {
  grants: {
    [domain: Domain]: DomainGrants
  }
}
