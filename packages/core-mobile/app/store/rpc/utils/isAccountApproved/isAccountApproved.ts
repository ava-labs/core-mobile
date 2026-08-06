import { SessionTypes } from '@walletconnect/types'
import {
  CoreAccountAddresses,
  getAddressForChainId
} from 'store/rpc/handlers/wc_sessionRequest/utils'
import { isAddressApprovedInNamespace } from 'services/walletconnectv2/utils'

// A granted account under ANY chain of the request's namespace authorizes the
// address — sessions grant per-namespace account access, not per-chain.
export const isAddressApproved = (
  address: string,
  caip2ChainId: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  const namespace = caip2ChainId.split(':')[0]
  const accounts = namespace ? namespaces[namespace]?.accounts : undefined

  if (!accounts) {
    return false
  }

  // Delegates so the comparison is namespace-aware. Lowercasing both sides —
  // as this did — is right for EVM but fails OPEN for the case-sensitive
  // encodings (base58 for Solana, bech32/base58 for AVAX and BIP122), where it
  // can make two genuinely different addresses compare equal.
  return isAddressApprovedInNamespace({
    caip10Account: `${caip2ChainId}:${address}`,
    accounts
  })
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
