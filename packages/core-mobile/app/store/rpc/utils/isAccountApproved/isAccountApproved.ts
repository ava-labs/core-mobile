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

  // Only EVM hex addresses are case-insensitive (EIP-55 checksums vary the
  // casing); other namespaces (e.g. base58 Solana) must match exactly.
  const matches =
    namespace === 'eip155'
      ? (acc: string): boolean =>
          acc.split(':')[2]?.toLowerCase() === address.toLowerCase()
      : (acc: string): boolean => acc.split(':')[2] === address

  return Boolean(namespaces[namespace]?.accounts.some(matches))
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
