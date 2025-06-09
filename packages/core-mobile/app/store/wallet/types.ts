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

export interface StoreWalletWithPinParams {
  walletId: WalletId
  walletSecret: string
  isResetting?: boolean
  type: WalletType
}
