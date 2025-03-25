import { WalletType } from 'services/wallet/types'

export const generateWalletName = (type: WalletType, index: number): string => {
  return `${type} Wallet ${index}`
}
