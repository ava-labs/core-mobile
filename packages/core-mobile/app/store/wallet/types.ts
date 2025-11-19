import { WalletType } from 'services/wallet/types'

export type WalletId = string
export interface Wallet {
  id: WalletId
  name: string
  type: WalletType
}

export interface WalletsState {
  wallets: { [key: WalletId]: Wallet }
  activeWalletId: WalletId | null
  isMigratingActiveAccounts: boolean
}

export interface StoreWalletParams {
  walletId: WalletId
  walletName?: string
  walletSecret: string
  type: WalletType
  name?: string
}
