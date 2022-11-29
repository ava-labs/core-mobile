import { Account } from 'store/account'
import { CoreWebAccount } from '../types'

export const mapAccountToCoreWebAccount = (
  account: Account,
  activeIndex: number
): CoreWebAccount => ({
  index: account.index,
  name: account.title,
  addressC: account.address,
  addressBTC: account.addressBtc,
  active: account.index === activeIndex
})
