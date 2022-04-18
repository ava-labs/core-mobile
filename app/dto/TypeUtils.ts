import { WalletType } from '@avalabs/avalanche-wallet-sdk'

// Add simple types here

export type WalletContextType =
  | { wallet?: WalletType | undefined; setMnemonic(mnemonic: string): void }
  | undefined
