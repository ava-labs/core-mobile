import { getPvmApi } from 'utils/network/pvm'
import BN from 'bn.js'
import { Account } from 'store/account'
import { exportC } from 'services/earn/exportC'
import networkService from 'services/network/NetworkService'
import { importP } from 'services/earn/importP'
import walletService from 'services/wallet/WalletService'

class EarnService {
  getCurrentValidators = (isTestnet: boolean) => {
    return getPvmApi(isTestnet).getCurrentValidators()
  }

  /**
   * @param cChainBalance in nAvax
   * @param requiredAmount in nAvax
   * @param activeAccount
   * @param isDevMode
   */
  async collectTokensForStaking(
    cChainBalance: BN,
    requiredAmount: BN,
    activeAccount: Account,
    isDevMode: boolean
  ): Promise<boolean> {
    return (
      (await exportC({
        cChainBalance,
        requiredAmount,
        walletService,
        networkService,
        activeAccount,
        isDevMode
      })) &&
      (await importP({
        walletService,
        networkService,
        activeAccount,
        isDevMode
      }))
    )
  }
}

export default new EarnService()
