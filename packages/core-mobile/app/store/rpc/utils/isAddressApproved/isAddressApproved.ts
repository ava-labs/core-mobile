import { SessionTypes } from '@walletconnect/types'

export const isAddressApproved = (
  address: string,
  namespaces: SessionTypes.Namespaces
): boolean => {
  // TODO don't hardcode eip155
  return Boolean(
    namespaces.eip155?.accounts.some(
      account => account.toLowerCase() === address.toLowerCase()
    )
  )
}
