import { WalletType } from 'services/wallet/types'

export const generateWalletName = (type: WalletType, index: number): string => {
  return `${
    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  } Wallet ${index}`
}
