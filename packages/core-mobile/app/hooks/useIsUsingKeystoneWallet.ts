import { CoreAccountType } from '@avalabs/types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectWalletType } from 'store/app'
import { WalletType } from 'services/wallet/types'

const useIsUsingKeystoneWallet = (): boolean => {
  const activeAccount = useSelector(selectActiveAccount)
  const walletType = useSelector(selectWalletType)

  return (
    walletType === WalletType.KEYSTONE &&
    activeAccount?.type === CoreAccountType.PRIMARY
  )
}

export default useIsUsingKeystoneWallet
