import { SessionTypes } from '@walletconnect/types'
import {
  CoreAccountAddresses,
  getAddressForChainId
} from 'store/rpc/handlers/wc_sessionRequest/utils'

export const isAccountApproved = (
  account: CoreAccountAddresses,
  caip2ChainId: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  const address = getAddressForChainId(caip2ChainId, account)
  const namespace = caip2ChainId.split(':')[0]

  if (!namespace || !namespaces[namespace]) {
    return false
  }

  return Boolean(
    address &&
      namespaces[namespace]?.accounts.some(
        acc => acc.split(':')[2]?.toLowerCase() === address.toLowerCase()
      )
  )
}
