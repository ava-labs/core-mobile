import { SessionTypes } from '@walletconnect/types'
import {
  CoreAccountAddresses,
  getAddressForChainId
} from 'store/rpc/handlers/wc_sessionRequest/utils'
import { isAddressApprovedInNamespace } from 'services/walletconnectv2/utils'

export const isAccountApproved = (
  account: CoreAccountAddresses,
  caip2ChainId: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  const address = getAddressForChainId(caip2ChainId, account)
  const namespace = caip2ChainId.split(':')[0]

  if (!namespace || !namespaces[namespace] || !address) {
    return false
  }

  const accounts = namespaces[namespace]?.accounts

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
