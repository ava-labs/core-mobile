import { Account } from 'store/account'

export const getPvmAddresses = (account: Account): string[] => {
  return account.xpAddresses.length > 0
    ? account.xpAddresses.map(xpAddress => 'P-' + xpAddress.address)
    : [account.addressPVM]
}
