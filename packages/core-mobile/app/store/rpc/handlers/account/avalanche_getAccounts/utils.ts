import { CoreAccountType, CorePrimaryAccount, WalletType } from '@avalabs/types'
import { Account } from 'store/account/types'

export const mapAccountToCoreWebAccount = (
  account: Account,
  activeIndex: number
): CorePrimaryAccount => ({
  index: account.index,
  name: account.title,
  addressC: account.address,
  addressBTC: account.addressBtc,
  addressAVM: account.addressAVM ?? '',
  addressPVM: account.addressPVM ?? '',
  addressCoreEth: account.addressCoreEth ?? '',
  active: account.index === activeIndex,
  walletType: WalletType.Mnemonic,
  walletId: '',
  id: account.index.toString(),
  type: CoreAccountType.PRIMARY
})