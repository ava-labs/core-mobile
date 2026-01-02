import { PrivateKeyWallet } from 'services/wallet/PrivateKeyWallet'
import WalletFactory from 'services/wallet/WalletFactory'
import { selectPrivateKeyWallets } from 'store/wallet/slice'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'

export const useCheckIfPrivateKeyWalletExists = (): ((
  privateKey: string
) => Promise<boolean>) => {
  const privateKeyWallets = useSelector(selectPrivateKeyWallets)

  return useCallback(
    async (privateKey: string): Promise<boolean> => {
      for (const wallet of privateKeyWallets) {
        const privateKeyWallet = await WalletFactory.createWallet({
          walletId: wallet.id,
          walletType: wallet.type
        })

        if (
          privateKeyWallet instanceof PrivateKeyWallet &&
          privateKeyWallet.matchesPrivateKey(privateKey)
        ) {
          return true
        }
      }

      return false
    },
    [privateKeyWallets]
  )
}
