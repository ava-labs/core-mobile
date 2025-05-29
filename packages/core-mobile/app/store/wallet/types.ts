import { WalletType } from 'services/wallet/types'

export interface Wallet {
  id: string
  name: string
  type: WalletType
}

export interface WalletsState {
  wallets: { [key: string]: Wallet }
  activeWalletId: string | null
}

export interface StoreWalletWithPinParams {
  walletId: string
  walletSecret: string
  isResetting?: boolean
  type: WalletType
}
