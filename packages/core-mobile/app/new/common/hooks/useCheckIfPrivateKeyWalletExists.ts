import { PrivateKeyWallet } from 'services/wallet/PrivateKeyWallet'
import { WalletType } from 'services/wallet/types'
import WalletFactory from 'services/wallet/WalletFactory'
import { selectWallets } from 'store/wallet/slice'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

export const useCheckIfPrivateKeyWalletExists = (): ((
  privateKey: string
) => Promise<boolean>) => {
  const wallets = useSelector(selectWallets)
  const privateKeyWallets = useMemo(
    () =>
      Object.values(wallets).filter(
        wallet => wallet.type === WalletType.PRIVATE_KEY
      ),
    [wallets]
  )

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
