import { WalletService } from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import { AccountCollection } from 'store/accounts'
import { BITCOIN_NETWORK } from '@avalabs/chains-sdk'

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
    address: walletService.getEvmWallet(newIndex).address //fixme - get avax c chain
  } as Account
}
