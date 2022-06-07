import { BITCOIN_NETWORK, FUJI_NETWORK } from 'store/network'
import { WalletService } from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import { AccountCollection } from 'store/accounts'

export async function createNextAccount(
  walletService: WalletService,
  accounts: AccountCollection
) {
  const newIndex = Object.keys(accounts).length
  return {
    index: newIndex,
    title: `Account ${newIndex + 1}`,
    addressBtc: (
      await walletService.getBtcWallet(newIndex, BITCOIN_NETWORK)
    ).getAddressBech32(),
    address: walletService.getEvmWallet(newIndex, FUJI_NETWORK).address
  } as Account
}
