import { BITCOIN_NETWORK, FUJI_NETWORK } from 'store/network'
import { WalletService } from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import {
  AccountCollection,
  addAccount as addAccountToStore,
  setAccountTitle as setAccountTitleStore,
  setActiveAccountIndex
} from 'store/accounts'
import { Store } from 'redux'

export async function addAccount(
  walletService: WalletService,
  accounts: AccountCollection,
  store: Store
) {
  const newIndex = Object.keys(accounts).length
  const newAccount = {
    index: newIndex,
    title: `Account ${newIndex + 1}`,
    addressBtc: (
      await walletService.getBtcWallet(newIndex, BITCOIN_NETWORK)
    ).getAddressBech32(),
    address: walletService.getEvmWallet(newIndex, FUJI_NETWORK).address
  } as Account

  store.dispatch(addAccountToStore(newAccount))
  return newAccount
}

export function setAccountTitle(
  title: string,
  accountIndex: number,
  store: Store
) {
  store.dispatch(
    setAccountTitleStore({ title: title, accountIndex: accountIndex })
  )
}

export function activateAccount(accountIndex: number, store: Store) {
  store.dispatch(setActiveAccountIndex(accountIndex))
}
