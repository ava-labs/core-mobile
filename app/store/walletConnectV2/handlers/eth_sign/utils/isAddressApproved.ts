import { SessionTypes } from '@walletconnect/types'

export const isAddressApproved = (
  address: string,
  namespaces: SessionTypes.Namespaces
) => {
  return namespaces.eip155?.accounts.some(
    account => account.toLowerCase() === address.toLowerCase()
  )
}
