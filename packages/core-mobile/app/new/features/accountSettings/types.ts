import { NetworkVMType } from '@avalabs/vm-module-types'
import { Account } from 'store/account'
import { Wallet } from 'store/wallet/types'

export type GetAccountDataProps = {
  hideSeparator: boolean
  isActive: boolean
  account: Account
  walletName?: string
}

export type GetPrimaryPlatformAccountDataProps = {
  numberOfAddresses: number
  networkVmType: NetworkVMType.AVM | NetworkVMType.PVM
  wallet: Wallet
  hideSeparator: boolean
}

export type GetImportedPlatformAccountDataProps = Omit<
  GetPrimaryPlatformAccountDataProps,
  'wallet'
>
