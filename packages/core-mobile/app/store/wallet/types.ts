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
}

export interface StoreWalletParams {
  walletId: WalletId
  walletSecret: string
  type: WalletType
}
