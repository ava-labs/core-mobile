import { CoreAccountType, CorePrimaryAccount } from '@avalabs/types'
import { Account } from 'store/account'

export const mapAccountToCoreWebAccount = (
  account: Account,
  activeIndex: number
): CorePrimaryAccount => ({
  index: account.index,
  name: account.title,
  addressC: account.address,
  addressBTC: account.addressBtc,
  active: account.index === activeIndex,
  type: CoreAccountType.PRIMARY
})
