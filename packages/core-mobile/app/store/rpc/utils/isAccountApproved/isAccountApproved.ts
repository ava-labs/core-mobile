import { SessionTypes } from '@walletconnect/types'
import {
  CoreAccountAddresses,
  getAddressForChainId
} from 'store/rpc/handlers/wc_sessionRequest/utils'

// A granted account under ANY chain of the request's namespace authorizes the
// address — sessions grant per-namespace account access, not per-chain.
export const isAddressApproved = (
  address: string,
  caip2ChainId: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  const namespace = caip2ChainId.split(':')[0]

  if (!namespace || !namespaces[namespace]) {
    return false
  }

  return Boolean(
    namespaces[namespace]?.accounts.some(
      acc => acc.split(':')[2]?.toLowerCase() === address.toLowerCase()
    )
  )
}

export const isAccountApproved = (
  account: CoreAccountAddresses,
  caip2ChainId: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  const address = getAddressForChainId(caip2ChainId, account)

  return Boolean(
    address && isAddressApproved(address, caip2ChainId, namespaces)
  )
}
